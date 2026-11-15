import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { absUrl, bad, listSelect, readableWhere, serializeBook } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const col = await prisma.collection.findFirst({
    where: { slug, isPublished: true },
    include: {
      books: {
        orderBy: { order: "asc" },
        where: { book: readableWhere },
        select: { note: true, book: { select: listSelect } },
      },
    },
  });
  if (!col) return bad("Collection introuvable", 404);

  return NextResponse.json({
    slug: col.slug,
    title: col.title,
    description: col.description,
    coverUrl: absUrl(col.coverImage),
    books: col.books.map((cb) => ({ ...serializeBook(cb.book), note: cb.note })),
  });
}
