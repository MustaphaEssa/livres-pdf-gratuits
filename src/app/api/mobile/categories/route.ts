import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { readableWhere } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [categories, langs] = await Promise.all([
    prisma.category.findMany({
      where: { type: "BOOK" },
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
        _count: { select: { books: { where: { book: readableWhere } } } },
      },
    }),
    prisma.book.groupBy({ by: ["language"], where: readableWhere, _count: { _all: true } }),
  ]);
  return NextResponse.json({
    categories: categories
      .filter((c) => c._count.books > 0)
      .map((c) => ({ name: c.name, slug: c.slug, count: c._count.books })),
    languages: langs
      .filter((l) => l.language)
      .map((l) => ({ code: l.language, count: l._count._all }))
      .sort((a, b) => b.count - a.count),
  });
}
