import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { LOCALE_HEADER, localizePath, normalizeLocale } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// « Surprenez-moi » : redirige vers la fiche d'un livre publié tiré au hasard.
export async function GET(request: Request) {
  const where = { isPublished: true, mediaType: "PDF" as const };
  const total = await prisma.book.count({ where });
  // Langue posée par le middleware (/en/livre-au-hasard → x-locale: en)
  const locale = normalizeLocale(request.headers.get(LOCALE_HEADER));
  const fallback = new URL(localizePath(locale, "/catalogue"), request.url);
  if (total === 0) return NextResponse.redirect(fallback, 307);

  const book = await prisma.book.findFirst({
    where,
    select: { slug: true },
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * total),
  });

  const res = NextResponse.redirect(new URL(localizePath(locale, book ? `/livre/${book.slug}` : "/catalogue"), request.url), 307);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
