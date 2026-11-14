import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

const collectionWithBooks = Prisma.validator<Prisma.CollectionDefaultArgs>()({
  include: {
    books: {
      orderBy: { order: "asc" },
      include: {
        book: {
          include: {
            categories: {
              include: { category: { select: { name: true, slug: true } } },
            },
          },
        },
      },
    },
  },
});

export type CollectionWithBooks = Prisma.CollectionGetPayload<typeof collectionWithBooks>;

// Collections publiées (liste publique), avec le nombre de livres
export async function getPublishedCollections() {
  return prisma.collection.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { books: true } } },
  });
}

export async function getPublishedCollectionBySlug(
  slug: string
): Promise<CollectionWithBooks | null> {
  const col = await prisma.collection.findUnique({
    where: { slug },
    include: collectionWithBooks.include,
  });
  if (!col || !col.isPublished) return null;
  return col;
}

// Admin
export async function getAllCollections() {
  return prisma.collection.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { books: true } } },
  });
}

export async function getCollectionById(id: string): Promise<CollectionWithBooks | null> {
  return prisma.collection.findUnique({
    where: { id },
    include: collectionWithBooks.include,
  });
}

export interface CollectionBookInput {
  bookId: string;
  note?: string | null;
}

export interface CollectionInput {
  title: string;
  slug?: string;
  description?: string | null;
  coverImage?: string | null;
  isPublished?: boolean;
  books?: CollectionBookInput[];
}

export async function slugExistsCollection(slug: string, exceptId?: string): Promise<boolean> {
  return (
    (await prisma.collection.count({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
    })) > 0
  );
}

export async function createCollection(input: CollectionInput): Promise<CollectionWithBooks> {
  const slug = input.slug?.trim() || slugify(input.title);
  const created = await prisma.collection.create({
    data: {
      slug,
      title: input.title,
      description: input.description ?? null,
      coverImage: input.coverImage ?? null,
      isPublished: input.isPublished ?? true,
      books: input.books?.length
        ? {
            create: input.books.map((b, i) => ({
              bookId: b.bookId,
              note: b.note ?? null,
              order: i,
            })),
          }
        : undefined,
    },
    include: collectionWithBooks.include,
  });
  return created;
}

export async function updateCollection(
  id: string,
  input: CollectionInput
): Promise<CollectionWithBooks> {
  // Remplace la liste des livres si fournie
  if (input.books) {
    await prisma.collectionBook.deleteMany({ where: { collectionId: id } });
    if (input.books.length) {
      await prisma.collectionBook.createMany({
        data: input.books.map((b, i) => ({
          collectionId: id,
          bookId: b.bookId,
          note: b.note ?? null,
          order: i,
        })),
        skipDuplicates: true,
      });
    }
  }
  return prisma.collection.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.slug !== undefined && input.slug ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage } : {}),
      ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
    },
    include: collectionWithBooks.include,
  });
}

export async function deleteCollection(id: string): Promise<void> {
  await prisma.collection.delete({ where: { id } });
}

// Collections de l'accueil : quelques collections avec leurs 3 premières couvertures
export async function getHomeCollections(limit = 4) {
  return prisma.collection.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: { select: { books: true } },
      books: {
        orderBy: { order: "asc" },
        take: 3,
        include: {
          book: { select: { slug: true, title: true, author: true, coverImage: true, language: true } },
        },
      },
    },
  });
}
