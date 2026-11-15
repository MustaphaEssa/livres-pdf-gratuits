import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { absUrl } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const collections = await prisma.collection.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { books: true } },
      books: { orderBy: { order: "asc" }, take: 1, include: { book: { select: { coverImage: true } } } },
    },
  });
  return NextResponse.json({
    collections: collections.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      bookCount: c._count.books,
      coverUrl: absUrl(c.coverImage ?? c.books[0]?.book.coverImage),
    })),
  });
}
