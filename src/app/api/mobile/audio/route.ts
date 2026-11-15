import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { intParam, listSelect, serializeBook } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Livres audio (streaming) : /api/mobile/audio?q=&page=&limit=
const audioWhere: Prisma.BookWhereInput = {
  isPublished: true,
  OR: [
    { mediaType: "AUDIO" },
    { AND: [{ audioTracks: { not: null } }, { NOT: { audioTracks: { in: ["", "[]"] } } }] },
  ],
};

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const limit = intParam(sp.get("limit"), 24, 1, 50);
  const where: Prisma.BookWhereInput = q
    ? {
        AND: [
          audioWhere,
          { OR: [{ title: { contains: q, mode: "insensitive" } }, { author: { contains: q, mode: "insensitive" } }] },
        ],
      }
    : audioWhere;

  const total = await prisma.book.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(intParam(sp.get("page"), 1, 1, 100000), totalPages);
  const books = await prisma.book.findMany({
    where,
    select: { ...listSelect, audioDuration: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
  return NextResponse.json({
    books: books.map((b) => ({ ...serializeBook(b), audioDuration: b.audioDuration })),
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  });
}
