import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { fetchArchiveDownloads, publicFileSize, deleteBookFiles } from "@/lib/cleanup";

export const runtime = "nodejs";

// Normalise un texte pour comparer titres/auteurs (minuscules, sans accents ni
// ponctuation, espaces compactés). Sert à repérer les doublons.
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Cache en mémoire des téléchargements Internet Archive (une seule instance de
// l'app). Évite de réinterroger archive.org à chaque analyse et garantit que la
// suppression porte sur les mêmes chiffres que l'aperçu affiché.
let dlCache: { at: number; map: Map<string, number> } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 h

async function getDownloads(ids: string[], refresh: boolean): Promise<Map<string, number>> {
  const fresh = dlCache && Date.now() - dlCache.at < CACHE_TTL;
  if (!refresh && fresh && dlCache) {
    // Complète le cache pour d'éventuels nouveaux sourceId importés depuis
    const missing = ids.filter((id) => !dlCache!.map.has(id));
    if (missing.length) {
      const add = await fetchArchiveDownloads(missing);
      for (const [k, v] of add) dlCache.map.set(k, v);
    }
    return dlCache.map;
  }
  const map = await fetchArchiveDownloads(ids);
  dlCache = { at: Date.now(), map };
  return map;
}

// Seule protection : popularité Internet Archive inconnue (livre absent/supprimé
// côté archive.org). On ne classe le nettoyage QUE sur l'importance internet,
// donc un livre sans ce chiffre ne peut pas être positionné → non supprimable.
function protectReason(downloads: number | undefined): string | null {
  if (downloads === undefined) return "Popularité Internet Archive inconnue";
  return null;
}

// Note purement INFORMATIVE sur l'activité du livre sur NOTRE site. N'empêche
// pas la suppression (le classement reste basé sur l'importance internet) ;
// sert juste à prévenir l'admin avant de supprimer un livre déjà utilisé ici.
function siteNote(b: {
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  _count: { favorites: number };
}): string | null {
  const parts: string[] = [];
  if (b.isFeatured) parts.push("en vedette");
  if (b.downloadCount > 0) parts.push(`${b.downloadCount} téléch.`);
  if (b.viewCount > 0) parts.push(`${b.viewCount} vue(s)`);
  if (b._count.favorites > 0) parts.push("en favori");
  return parts.length ? parts.join(" · ") : null;
}

// GET : analyse. Renvoie tous les livres importés (sourceId non nul), classés
// du moins populaire (sur Internet Archive) au plus populaire, avec taille sur
// disque et statut « protégé » (non supprimable). Aucune suppression ici.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const refresh = new URL(request.url).searchParams.get("refresh") === "1";

  const books = await prisma.book.findMany({
    where: { sourceId: { not: null } },
    select: {
      id: true,
      slug: true,
      title: true,
      author: true,
      sourceId: true,
      pdfUrl: true,
      coverImage: true,
      downloadCount: true,
      viewCount: true,
      isFeatured: true,
      _count: { select: { favorites: true } },
    },
  });

  const ids = books.map((b) => b.sourceId).filter((s): s is string => Boolean(s));
  const downloads = await getDownloads(ids, refresh);

  const rows = await Promise.all(
    books.map(async (b) => {
      const dl = b.sourceId ? downloads.get(b.sourceId) : undefined;
      const reason = protectReason(dl);
      const sizeBytes =
        (await publicFileSize(b.pdfUrl)) + (await publicFileSize(b.coverImage));
      return {
        id: b.id,
        slug: b.slug,
        title: b.title,
        author: b.author,
        downloads: dl ?? null,
        sizeBytes,
        isProtected: reason !== null,
        reason,
        siteNote: siteNote(b),
      };
    })
  );

  // Détection des doublons : même titre + même auteur normalisés. Dans chaque
  // groupe on GARDE la copie la plus populaire sur internet (plus de
  // téléchargements IA ; à égalité, le plus gros fichier) et on marque les
  // autres comme doublons supprimables.
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${norm(r.title)}|${norm(r.author)}`;
    if (!norm(r.title)) continue; // titre vide → pas de regroupement fiable
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }
  type Row = (typeof rows)[number] & { dupKey: string | null; dupIsKeeper: boolean };
  const tagged: Row[] = rows.map((r) => ({ ...r, dupKey: null, dupIsKeeper: false }));
  const byId = new Map(tagged.map((r) => [r.id, r]));
  let dupGroups = 0;
  for (const [key, g] of groups) {
    if (g.length < 2) continue;
    dupGroups++;
    // meilleur = plus de téléchargements IA, puis plus gros fichier
    const keeper = [...g].sort(
      (a, b) =>
        (b.downloads ?? -1) - (a.downloads ?? -1) || b.sizeBytes - a.sizeBytes
    )[0];
    for (const r of g) {
      const t = byId.get(r.id)!;
      t.dupKey = key;
      t.dupIsKeeper = r.id === keeper.id;
    }
  }

  // Supprimables d'abord (popularité croissante), protégés en fin de liste
  tagged.sort((a, b) => {
    if (a.isProtected !== b.isProtected) return a.isProtected ? 1 : -1;
    return (a.downloads ?? Number.POSITIVE_INFINITY) - (b.downloads ?? Number.POSITIVE_INFINITY);
  });

  // Espace récupérable en ne gardant qu'une copie par groupe de doublons
  const dupDeletableBytes = tagged
    .filter((r) => r.dupKey && !r.dupIsKeeper && !r.isProtected)
    .reduce((sum, r) => sum + r.sizeBytes, 0);

  return NextResponse.json({
    books: tagged,
    total: books.length,
    deletable: tagged.filter((r) => !r.isProtected).length,
    dupGroups,
    dupDeletable: tagged.filter((r) => r.dupKey && !r.dupIsKeeper && !r.isProtected).length,
    dupDeletableBytes,
    cachedAt: dlCache?.at ?? null,
  });
}

// POST : suppression. Reçoit { ids: string[] } (la sélection validée par
// l'utilisateur). Re-vérifie côté serveur les protections « dures » (vedette /
// consulté / téléchargé / favori) avant de supprimer fichiers + ligne en base.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if (!ids.length) return NextResponse.json({ error: "Aucun livre sélectionné" }, { status: 400 });

  // Invariance : le nettoyage ne touche QUE des livres importés (sourceId non
  // nul). Un livre ajouté à la main ne peut jamais être supprimé par cet outil.
  const books = await prisma.book.findMany({
    where: { id: { in: ids }, sourceId: { not: null } },
    select: {
      id: true,
      title: true,
      pdfUrl: true,
      coverImage: true,
    },
  });

  let deleted = 0;
  let skipped = ids.length - books.length; // ids non importés / introuvables
  let freedBytes = 0;

  for (const b of books) {
    // Taille mesurée AVANT suppression des fichiers
    freedBytes += (await publicFileSize(b.pdfUrl)) + (await publicFileSize(b.coverImage));
    await deleteBookFiles(b.pdfUrl, b.coverImage);
    try {
      await prisma.book.delete({ where: { id: b.id } }); // cascade : catégories, avis, favoris…
      deleted++;
    } catch {
      skipped++;
    }
  }

  // Les livres supprimés ne sont plus dans le cache à la prochaine analyse ;
  // on purge pour forcer un recalcul propre côté popularité.
  if (deleted > 0) dlCache = null;

  return NextResponse.json({ deleted, skipped, freedBytes });
}
