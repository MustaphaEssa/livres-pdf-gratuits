import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// « Surprenez-moi » : redirige vers la fiche d'un livre publié tiré au hasard.
export async function GET(request: Request) {
  const where = { isPublished: true, mediaType: "PDF" as const };
  const total = await prisma.book.count({ where });
  const fallback = new URL("/catalogue", request.url);
  if (total === 0) return NextResponse.redirect(fallback, 307);

  const book = await prisma.book.findFirst({
    where,
    select: { slug: true },
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * total),
  });

  const res = NextResponse.redirect(new URL(book ? `/livre/${book.slug}` : "/catalogue", request.url), 307);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
