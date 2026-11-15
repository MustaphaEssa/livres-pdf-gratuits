import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { intParam, listSelect, readableWhere, serializeBook } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Catalogue paginé : /api/mobile/books?q=&category=&author=&lang=&sort=&page=&limit=
//   sort : popular (défaut) | newest | az | author
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const category = sp.get("category");
  const author = sp.get("author");
  const lang = sp.get("lang");
  const sort = sp.get("sort") ?? "popular";
  const limit = intParam(sp.get("limit"), 24, 1, 50);

  const and: Prisma.BookWhereInput[] = [readableWhere];
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (category) and.push({ categories: { some: { category: { slug: category } } } });
  if (author) and.push({ authorSlug: author });
  if (lang) and.push({ language: lang });
  const where: Prisma.BookWhereInput = { AND: and };

  const orderBy: Prisma.BookOrderByWithRelationInput[] =
    sort === "newest"
      ? [{ createdAt: "desc" }]
      : sort === "az"
        ? [{ title: "asc" }]
        : sort === "author"
          ? [{ author: "asc" }, { title: "asc" }]
          : [{ downloadCount: "desc" }, { viewCount: "desc" }, { id: "asc" }];

  const total = await prisma.book.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(intParam(sp.get("page"), 1, 1, 100000), totalPages);
  const books = await prisma.book.findMany({
    where,
    select: listSelect,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    books: books.map(serializeBook),
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  });
}
