import "server-only";
import { unlink } from "fs/promises";
import path from "path";
import prisma from "@/lib/db";

/**
 * Fusion des livres d'une même œuvre présents en plusieurs exemplaires/formats.
 *
 * Internet Archive, LibriVox et Gutenberg peuvent créer des fiches séparées pour
 * la même œuvre (un PDF, un livre audio, un EPUB…). On regroupe par
 * titre+auteur normalisés et on consolide tous les formats sur UNE fiche
 * (pdfUrl + epubUrl + audioTracks), puis on supprime les doublons et leurs
 * fichiers devenus inutiles.
 */

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Retire les mentions de tome/volume pour regrouper une œuvre, SANS fusionner
// deux tomes différents (on garde le numéro comme discriminant).
function workKey(title: string, authorSlug: string | null, author: string): string {
  const t = norm(title);
  const who = (authorSlug && authorSlug.trim()) || norm(author);
  return `${who}##${t}`;
}

type BookLite = {
  id: string;
  slug: string;
  title: string;
  author: string;
  authorSlug: string | null;
  mediaType: string;
  pdfUrl: string | null;
  pdfSize: number | null;
  epubUrl: string | null;
  audioSourceId: string | null;
  audioTracks: string | null;
  audioDuration: number | null;
  coverImage: string | null;
  pageCount: number | null;
  downloadCount: number;
  viewCount: number;
  rating: number;
  ratingCount: number;
};

const SELECT = {
  id: true, slug: true, title: true, author: true, authorSlug: true, mediaType: true,
  pdfUrl: true, pdfSize: true, epubUrl: true, audioSourceId: true, audioTracks: true,
  audioDuration: true, coverImage: true, pageCount: true, downloadCount: true,
  viewCount: true, rating: true, ratingCount: true,
} as const;

export interface MergeGroup {
  key: string;
  title: string;
  author: string;
  books: {
    id: string;
    slug: string;
    mediaType: string;
    hasPdf: boolean;
    hasEpub: boolean;
    hasAudio: boolean;
    pdfSizeMb: number | null;
  }[];
}

const hasAudio = (b: BookLite) => !!(b.audioTracks || b.audioSourceId);

// Liste les groupes de ≥2 livres qui forment la même œuvre (candidats à la fusion).
export async function findMergeGroups(): Promise<MergeGroup[]> {
  const books = (await prisma.book.findMany({ select: SELECT })) as BookLite[];
  const groups = new Map<string, BookLite[]>();
  for (const b of books) {
    const k = workKey(b.title, b.authorSlug, b.author);
    if (!groups.get(k)) groups.set(k, []);
    groups.get(k)!.push(b);
  }
  const out: MergeGroup[] = [];
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    out.push({
      key,
      title: list[0].title,
      author: list[0].author,
      books: list.map((b) => ({
        id: b.id,
        slug: b.slug,
        mediaType: b.mediaType,
        hasPdf: !!b.pdfUrl,
        hasEpub: !!b.epubUrl,
        hasAudio: hasAudio(b),
        pdfSizeMb: b.pdfSize ? Math.round((b.pdfSize / 1024 / 1024) * 10) / 10 : null,
      })),
    });
  }
  // Les groupes multi-format d'abord, puis les plus gros
  out.sort((a, b) => b.books.length - a.books.length);
  return out;
}

// Choisit la fiche qui survit : priorité au PDF le plus léger, puis couverture,
// puis popularité.
function pickCanonical(books: BookLite[]): BookLite {
  return [...books].sort((a, b) => {
    const ap = a.pdfUrl ? 1 : 0;
    const bp = b.pdfUrl ? 1 : 0;
    if (ap !== bp) return bp - ap; // a un PDF d'abord
    if (ap && bp) {
      const as = a.pdfSize ?? Number.MAX_SAFE_INTEGER;
      const bs = b.pdfSize ?? Number.MAX_SAFE_INTEGER;
      if (as !== bs) return as - bs; // PDF le plus léger
    }
    const ac = a.coverImage ? 1 : 0;
    const bc = b.coverImage ? 1 : 0;
    if (ac !== bc) return bc - ac;
    return b.downloadCount - a.downloadCount;
  })[0];
}

function diskPath(url: string | null): string | null {
  if (!url || !url.startsWith("/uploads/")) return null;
  return path.join(process.cwd(), "public", url);
}

// Fusionne un ensemble de livres (même œuvre) sur une fiche canonique.
export async function mergeGroup(
  bookIds: string[]
): Promise<{ keptSlug: string; deleted: number } | null> {
  const books = (await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: SELECT,
  })) as BookLite[];
  if (books.length < 2) return null;

  const canonical = pickCanonical(books);
  const others = books.filter((b) => b.id !== canonical.id);

  // Consolide les formats (garde ceux de la canonique, complète avec les autres)
  const lightestPdf = books
    .filter((b) => b.pdfUrl)
    .sort((a, b) => (a.pdfSize ?? 1e15) - (b.pdfSize ?? 1e15))[0];
  const epubSrc = books.find((b) => b.epubUrl);
  const audioSrc = books.find((b) => hasAudio(b));
  const coverSrc = canonical.coverImage ? canonical : books.find((b) => b.coverImage);

  const finalPdfUrl = lightestPdf?.pdfUrl ?? null;
  const finalPdfSize = lightestPdf?.pdfSize ?? null;
  const finalEpubUrl = epubSrc?.epubUrl ?? null;
  const finalCover = coverSrc?.coverImage ?? null;
  const finalPages = canonical.pageCount ?? lightestPdf?.pageCount ?? null;
  const finalMediaType = finalPdfUrl ? "PDF" : audioSrc ? "AUDIO" : canonical.mediaType;

  // Métriques cumulées + note pondérée
  const sumDl = books.reduce((s, b) => s + b.downloadCount, 0);
  const sumView = books.reduce((s, b) => s + b.viewCount, 0);
  const sumRc = books.reduce((s, b) => s + b.ratingCount, 0);
  const weighted = sumRc > 0 ? books.reduce((s, b) => s + b.rating * b.ratingCount, 0) / sumRc : canonical.rating;

  const otherIds = others.map((b) => b.id);

  await prisma.$transaction(async (tx) => {
    // Réassigne les relations sans contrainte d'unicité
    await tx.review.updateMany({ where: { bookId: { in: otherIds } }, data: { bookId: canonical.id } });
    await tx.download.updateMany({ where: { bookId: { in: otherIds } }, data: { bookId: canonical.id } });

    // Favoris : évite le conflit unique(userId, bookId)
    const favs = await tx.favorite.findMany({ where: { bookId: { in: otherIds } } });
    for (const f of favs) {
      const exists = await tx.favorite.findUnique({
        where: { userId_bookId: { userId: f.userId, bookId: canonical.id } },
      });
      if (exists) await tx.favorite.delete({ where: { id: f.id } });
      else await tx.favorite.update({ where: { id: f.id }, data: { bookId: canonical.id } });
    }

    // Collections : clé composite (collectionId, bookId) → crée pour la canonique
    // si absente, le doublon partira avec le livre.
    const cbs = await tx.collectionBook.findMany({ where: { bookId: { in: otherIds } } });
    for (const cb of cbs) {
      const exists = await tx.collectionBook.findUnique({
        where: { collectionId_bookId: { collectionId: cb.collectionId, bookId: canonical.id } },
      });
      if (!exists) {
        await tx.collectionBook.create({
          data: { collectionId: cb.collectionId, bookId: canonical.id, note: cb.note, order: cb.order },
        });
      }
    }

    // Catégories : union
    const cats = await tx.bookCategory.findMany({ where: { bookId: { in: books.map((b) => b.id) } } });
    const catIds = Array.from(new Set(cats.map((c) => c.categoryId)));
    for (const categoryId of catIds) {
      await tx.bookCategory.upsert({
        where: { bookId_categoryId: { bookId: canonical.id, categoryId } },
        create: { bookId: canonical.id, categoryId },
        update: {},
      });
    }

    // Met à jour la fiche canonique avec tous les formats + métriques
    await tx.book.update({
      where: { id: canonical.id },
      data: {
        mediaType: finalMediaType,
        pdfUrl: finalPdfUrl,
        pdfSize: finalPdfSize,
        epubUrl: finalEpubUrl,
        coverImage: finalCover,
        pageCount: finalPages,
        audioSourceId: audioSrc?.audioSourceId ?? canonical.audioSourceId,
        audioTracks: audioSrc?.audioTracks ?? canonical.audioTracks,
        audioDuration: audioSrc?.audioDuration ?? canonical.audioDuration,
        downloadCount: sumDl,
        viewCount: sumView,
        rating: weighted,
        ratingCount: sumRc,
      },
    });

    // Supprime les doublons (cascade nettoie leurs relations restantes)
    await tx.book.deleteMany({ where: { id: { in: otherIds } } });
  });

  // Supprime les fichiers des doublons devenus inutiles (hors de la canonique)
  const keep = new Set([finalPdfUrl, finalEpubUrl, finalCover].filter(Boolean) as string[]);
  for (const b of others) {
    for (const url of [b.pdfUrl, b.epubUrl, b.coverImage]) {
      if (url && !keep.has(url)) {
        const p = diskPath(url);
        if (p) await unlink(p).catch(() => {});
      }
    }
  }

  return { keptSlug: canonical.slug, deleted: others.length };
}

// Fusionne TOUS les groupes candidats.
export async function mergeAllGroups(): Promise<{ groups: number; deleted: number }> {
  const groups = await findMergeGroups();
  let deleted = 0;
  let merged = 0;
  for (const g of groups) {
    const res = await mergeGroup(g.books.map((b) => b.id));
    if (res) {
      deleted += res.deleted;
      merged++;
    }
  }
  return { groups: merged, deleted };
}
