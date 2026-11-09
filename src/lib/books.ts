import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

// Nombre de livres par page du catalogue
export const PAGE_SIZE = 12;

export type SortOption = "popular" | "newest" | "title-asc" | "title-desc";

const bookWithCategories = Prisma.validator<Prisma.BookDefaultArgs>()({
  include: {
    categories: {
      include: { category: { select: { name: true, slug: true } } },
    },
  },
});

export type BookWithCategories = Prisma.BookGetPayload<typeof bookWithCategories>;

function orderByFor(sort: SortOption): Prisma.BookOrderByWithRelationInput {
  switch (sort) {
    case "newest":
      return { createdAt: "desc" };
    case "title-asc":
      return { title: "asc" };
    case "title-desc":
      return { title: "desc" };
    case "popular":
    default:
      return { downloadCount: "desc" };
  }
}

// Livres mis en avant pour la page d'accueil
export async function getFeaturedBooks(limit = 6): Promise<BookWithCategories[]> {
  return prisma.book.findMany({
    where: { isPublished: true, isFeatured: true, mediaType: "PDF" },
    include: bookWithCategories.include,
    orderBy: { downloadCount: "desc" },
    take: limit,
  });
}

// Derniers livres ajoutés
export async function getLatestBooks(limit = 6): Promise<BookWithCategories[]> {
  return prisma.book.findMany({
    where: { isPublished: true, mediaType: "PDF" },
    include: bookWithCategories.include,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export interface SearchBooksParams {
  query?: string;
  category?: string;
  language?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface SearchBooksResult {
  books: BookWithCategories[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Recherche paginée du catalogue (titre/auteur + filtres catégorie/langue + tri)
export async function searchBooks(
  params: SearchBooksParams
): Promise<SearchBooksResult> {
  const {
    query,
    category,
    language,
    sort = "popular",
    page = 1,
    pageSize = PAGE_SIZE,
  } = params;

  const where: Prisma.BookWhereInput = { isPublished: true, mediaType: "PDF" };

  if (query) {
    // PostgreSQL : `mode: "insensitive"` pour une recherche insensible à la casse
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.categories = { some: { category: { slug: category } } };
  }

  if (language) {
    where.language = language;
  }

  const currentPage = Math.max(1, page);

  const [total, books] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      include: bookWithCategories.include,
      orderBy: orderByFor(sort),
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    books,
    total,
    page: currentPage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// Livres similaires : même(s) catégorie(s), hors livre courant.
// Complète avec les plus téléchargés si le nombre est insuffisant.
export async function getRelatedBooks(
  bookId: string,
  categoryIds: string[],
  limit = 4
): Promise<BookWithCategories[]> {
  const related = categoryIds.length
    ? await prisma.book.findMany({
        where: {
          isPublished: true,
          mediaType: "PDF",
          id: { not: bookId },
          categories: { some: { categoryId: { in: categoryIds } } },
        },
        include: bookWithCategories.include,
        orderBy: { downloadCount: "desc" },
        take: limit,
      })
    : [];

  if (related.length >= limit) return related;

  // Complète avec d'autres livres populaires (sans doublons)
  const excludeIds = [bookId, ...related.map((b) => b.id)];
  const fill = await prisma.book.findMany({
    where: { isPublished: true, mediaType: "PDF", id: { notIn: excludeIds } },
    include: bookWithCategories.include,
    orderBy: { downloadCount: "desc" },
    take: limit - related.length,
  });

  return [...related, ...fill];
}

// Autres livres du même auteur (hors livre courant)
export async function getSameAuthorBooks(
  bookId: string,
  authorSlug: string | null,
  limit = 6,
  mediaType: "PDF" | "AUDIO" = "PDF"
): Promise<BookWithCategories[]> {
  if (!authorSlug) return [];
  return prisma.book.findMany({
    where: { isPublished: true, mediaType, authorSlug, id: { not: bookId } },
    include: bookWithCategories.include,
    orderBy: { downloadCount: "desc" },
    take: limit,
  });
}

// Fiche auteur (bio, photo, dates) depuis la table Author
export async function getAuthorProfile(authorSlug: string | null) {
  if (!authorSlug) return null;
  return prisma.author.findUnique({
    where: { slug: authorSlug },
    select: { slug: true, name: true, image: true, bio: true, birthYear: true, deathYear: true },
  });
}

// Autres livres du même genre/catégorie (hors livre courant)
export async function getBooksByGenre(
  categorySlug: string | undefined,
  excludeBookId: string,
  limit = 6,
  mediaType: "PDF" | "AUDIO" = "PDF"
): Promise<BookWithCategories[]> {
  if (!categorySlug) return [];
  return prisma.book.findMany({
    where: {
      isPublished: true,
      mediaType,
      id: { not: excludeBookId },
      categories: { some: { category: { slug: categorySlug } } },
    },
    include: bookWithCategories.include,
    orderBy: { downloadCount: "desc" },
    take: limit,
  });
}

// Livres d'un auteur (paginés) + nom affiché de l'auteur
export async function getBooksByAuthorSlug(
  authorSlug: string,
  page = 1,
  pageSize = PAGE_SIZE
): Promise<SearchBooksResult & { authorName: string | null }> {
  const where: Prisma.BookWhereInput = { isPublished: true, authorSlug, mediaType: "PDF" };
  const currentPage = Math.max(1, page);

  const [total, books] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      include: bookWithCategories.include,
      orderBy: { downloadCount: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    books,
    total,
    page: currentPage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    authorName: books[0]?.author ?? null,
  };
}

// Liste des auteurs (slug + nom + photo + nombre de livres), triée par nom.
// Le nom et la photo proviennent de la table Author quand elle est remplie.
export async function getAuthorsWithCounts(): Promise<
  { slug: string; name: string; count: number; image: string | null }[]
> {
  const rows = await prisma.book.groupBy({
    by: ["authorSlug", "author"],
    where: { isPublished: true, authorSlug: { not: null }, mediaType: "PDF" },
    _count: { _all: true },
  });

  const bySlug = new Map<
    string,
    { slug: string; name: string; count: number; image: string | null }
  >();
  for (const r of rows) {
    const slug = r.authorSlug as string;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.count += r._count._all;
    } else {
      bySlug.set(slug, { slug, name: r.author, count: r._count._all, image: null });
    }
  }

  // Enrichit avec la fiche Author (nom affichable propre + photo)
  const authors = await prisma.author.findMany({
    where: { slug: { in: Array.from(bySlug.keys()) } },
    select: { slug: true, name: true, image: true },
  });
  for (const a of authors) {
    const e = bySlug.get(a.slug);
    if (e) {
      e.name = a.name;
      e.image = a.image;
    }
  }

  return Array.from(bySlug.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "fr")
  );
}

// Fiche d'un livre par slug
export async function getBookBySlug(
  slug: string
): Promise<BookWithCategories | null> {
  return prisma.book.findUnique({
    where: { slug },
    include: bookWithCategories.include,
  });
}

// Catégories avec le nombre de livres publiés dans chacune
export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    where: { type: "BOOK" },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          books: { where: { book: { isPublished: true, mediaType: "PDF" } } },
        },
      },
    },
  });

  return categories.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    count: cat._count.books,
  }));
}

// ==================== LIVRES AUDIO ====================

// Livres audio publiés (paginés) pour la page /livres-audio
export async function getAudiobooks(
  page = 1,
  pageSize = PAGE_SIZE,
  sort: SortOption = "newest"
): Promise<SearchBooksResult> {
  const where: Prisma.BookWhereInput = { isPublished: true, mediaType: "AUDIO" };
  const currentPage = Math.max(1, page);

  const [total, books] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      include: bookWithCategories.include,
      orderBy: orderByFor(sort),
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    books,
    total,
    page: currentPage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// Quelques livres audio récents (accueil, encarts…)
export async function getLatestAudiobooks(limit = 6): Promise<BookWithCategories[]> {
  return prisma.book.findMany({
    where: { isPublished: true, mediaType: "AUDIO" },
    include: bookWithCategories.include,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// Parse la playlist JSON d'un livre audio en liste de pistes typées
export interface AudioTrackItem {
  title: string;
  url: string;
  duration: number;
}
export function parseAudioTracks(raw: string | null | undefined): AudioTrackItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t) => t && typeof t.url === "string")
      .map((t, i) => ({
        title: typeof t.title === "string" && t.title ? t.title : `Chapitre ${i + 1}`,
        url: t.url,
        duration: typeof t.duration === "number" ? t.duration : 0,
      }));
  } catch {
    return [];
  }
}

export interface CreateBookInput {
  slug: string;
  title: string;
  author: string;
  description?: string | null;
  pdfUrl: string;
  pdfSize?: number | null;
  pageCount?: number | null;
  coverImage?: string | null;
  language?: string;
  publishedYear?: number | null;
  isbn?: string | null;
  publisher?: string | null;
  rating?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  categorySlug?: string;
}

// Crée un livre (avec relation catégorie optionnelle via son slug)
export async function createBook(
  input: CreateBookInput
): Promise<BookWithCategories> {
  const { categorySlug, ...data } = input;

  let categoryConnect: Prisma.BookCategoryCreateNestedManyWithoutBookInput | undefined;
  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (category) {
      categoryConnect = { create: [{ categoryId: category.id }] };
    }
  }

  return prisma.book.create({
    data: {
      ...data,
      authorSlug: data.author ? slugify(data.author) : null,
      language: data.language ?? "fr",
      categories: categoryConnect,
    },
    include: bookWithCategories.include,
  });
}

// Vérifie si un slug de livre est déjà pris (optionnellement en excluant un id)
export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
  const count = await prisma.book.count({
    where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
  });
  return count > 0;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  slug?: string;
  description?: string | null;
  language?: string;
  publishedYear?: number | null;
  isbn?: string | null;
  publisher?: string | null;
  pageCount?: number | null;
  coverImage?: string | null;
  isFeatured?: boolean;
  isPublished?: boolean;
  categorySlug?: string;
}

// Met à jour un livre (métadonnées + catégorie optionnelle)
export async function updateBook(
  id: string,
  input: UpdateBookInput
): Promise<BookWithCategories> {
  const { categorySlug, ...data } = input;

  // Recalcule le slug auteur si l'auteur change
  const dataWithAuthorSlug: UpdateBookInput & { authorSlug?: string } =
    typeof data.author === "string"
      ? { ...data, authorSlug: slugify(data.author) }
      : data;

  // Remplace la catégorie si fournie
  if (categorySlug !== undefined) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    await prisma.bookCategory.deleteMany({ where: { bookId: id } });
    if (category) {
      await prisma.bookCategory.create({
        data: { bookId: id, categoryId: category.id },
      });
    }
  }

  return prisma.book.update({
    where: { id },
    data: dataWithAuthorSlug,
    include: bookWithCategories.include,
  });
}

// Recalcule la note moyenne et le nombre d'avis approuvés d'un livre
export async function recomputeBookRating(bookId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { bookId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.book.update({
    where: { id: bookId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count,
    },
  });
}

// Récupère un livre par id
export async function getBookById(
  id: string
): Promise<BookWithCategories | null> {
  return prisma.book.findUnique({
    where: { id },
    include: bookWithCategories.include,
  });
}

// Supprime un livre
export async function deleteBook(id: string): Promise<BookWithCategories | null> {
  const book = await prisma.book.findUnique({
    where: { id },
    include: bookWithCategories.include,
  });
  if (!book) return null;
  await prisma.book.delete({ where: { id } });
  return book;
}

// Incrémente le compteur de vues d'un livre
export async function incrementViewCount(id: string): Promise<void> {
  await prisma.book.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}

// Incrémente le compteur de téléchargements et journalise le téléchargement
export async function registerDownload(
  bookId: string,
  meta?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    userId?: string | null;
  }
): Promise<void> {
  await prisma.$transaction([
    prisma.book.update({
      where: { id: bookId },
      data: { downloadCount: { increment: 1 } },
    }),
    prisma.download.create({
      data: {
        bookId,
        userId: meta?.userId ?? null,
        ipAddress: meta?.ipAddress ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    }),
  ]);
}

// Historique de téléchargements d'un utilisateur (livres distincts, récents)
export async function getUserDownloads(
  userId: string,
  limit = 50
): Promise<BookWithCategories[]> {
  const downloads = await prisma.download.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      book: { include: bookWithCategories.include },
    },
  });
  // Dédoublonne par livre en gardant l'ordre
  const seen = new Set<string>();
  const books: BookWithCategories[] = [];
  for (const d of downloads) {
    if (!seen.has(d.bookId)) {
      seen.add(d.bookId);
      books.push(d.book);
      if (books.length >= limit) break;
    }
  }
  return books;
}
