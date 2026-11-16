import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { SITE_URL } from "@/lib/site";
import { verifySessionToken, type SessionData } from "@/lib/auth";

// Jeton mobile : 90 jours (le jeton web, lui, dure 8 h)
export const MOBILE_TOKEN_MAX_AGE = 60 * 60 * 24 * 90;

/** Champs lus pour la liste (légers). */
export const listSelect = {
  id: true,
  slug: true,
  title: true,
  author: true,
  authorSlug: true,
  coverImage: true,
  language: true,
  rating: true,
  ratingCount: true,
  pageCount: true,
  pdfUrl: true,
  epubUrl: true,
  pdfSize: true,
  categories: { select: { category: { select: { name: true, slug: true } } } },
} satisfies Prisma.BookSelect;

/** Champs lus pour la fiche détail. */
export const detailSelect = {
  ...listSelect,
  description: true,
  publishedYear: true,
  publisher: true,
  isbn: true,
  downloadCount: true,
  viewCount: true,
} satisfies Prisma.BookSelect;

/** Filtre commun : uniquement les livres publiés qui ont un PDF (pas l'audio). */
export const readableWhere: Prisma.BookWhereInput = {
  isPublished: true,
  pdfUrl: { not: null },
  NOT: { mediaType: "AUDIO" },
  // Sécurité Google Play : l'app n'expose que des œuvres du domaine public —
  // Gutenberg, ou publiées en 1929 ou avant (année inconnue = import Internet Archive
  // déjà restreint à ≤ 1929).
  OR: [
    { publishedYear: null },
    { publishedYear: { lte: 1929 } },
    { sourceId: { startsWith: "gutenberg:" } },
  ],
};

export function absUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

type ListBook = Prisma.BookGetPayload<{ select: typeof listSelect }>;
type DetailBook = Prisma.BookGetPayload<{ select: typeof detailSelect }>;

export function serializeBook(b: ListBook | DetailBook) {
  const extra = b as Partial<DetailBook>;
  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    author: b.author,
    authorSlug: b.authorSlug,
    coverUrl: absUrl(b.coverImage),
    language: b.language,
    rating: b.rating,
    ratingCount: b.ratingCount,
    pageCount: b.pageCount,
    pdfSize: b.pdfSize,
    // Le PDF passe toujours par notre proxy (même origine, requêtes Range, pas de CORS)
    pdfUrl: b.pdfUrl ? `${SITE_URL}/livre/${b.slug}/pdf` : null,
    epubUrl: b.epubUrl,
    categories: b.categories.map((c) => ({ name: c.category.name, slug: c.category.slug })),
    ...(extra.description !== undefined
      ? {
          description: extra.description,
          publishedYear: extra.publishedYear ?? null,
          publisher: extra.publisher ?? null,
          isbn: extra.isbn ?? null,
          downloadCount: extra.downloadCount ?? 0,
          viewCount: extra.viewCount ?? 0,
        }
      : {}),
  };
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Utilisateur identifié par « Authorization: Bearer <jeton> » (ou null). */
export async function getMobileUser(request: Request): Promise<SessionData | null> {
  const header = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) return null;
  return verifySessionToken(m[1], "user");
}

export function intParam(value: string | null, def: number, min: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}
