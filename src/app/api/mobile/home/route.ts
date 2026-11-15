import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { listSelect, readableWhere, serializeBook, absUrl } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Écran d'accueil de l'app : nouveautés, populaires, collections, catégories.
export async function GET() {
  const [latest, popular, featured, collections, categories] = await Promise.all([
    prisma.book.findMany({
      where: readableWhere,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.book.findMany({
      where: readableWhere,
      select: listSelect,
      orderBy: [{ downloadCount: "desc" }, { viewCount: "desc" }],
      take: 12,
    }),
    prisma.book.findMany({
      where: { ...readableWhere, isFeatured: true },
      select: listSelect,
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.collection.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        _count: { select: { books: true } },
        books: {
          orderBy: { order: "asc" },
          take: 1,
          include: { book: { select: { coverImage: true } } },
        },
      },
    }),
    prisma.category.findMany({
      where: { type: "BOOK" },
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
        _count: { select: { books: { where: { book: readableWhere } } } },
      },
    }),
  ]);

  return NextResponse.json({
    featured: featured.map(serializeBook),
    latest: latest.map(serializeBook),
    popular: popular.map(serializeBook),
    collections: collections.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      bookCount: c._count.books,
      coverUrl: absUrl(c.coverImage ?? c.books[0]?.book.coverImage),
    })),
    categories: categories
      .filter((c) => c._count.books > 0)
      .map((c) => ({ name: c.name, slug: c.slug, count: c._count.books })),
  });
}
