import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;
const PERIODS = [7, 14, 30, 90, 365];

// L'app Android (Flutter, package http) envoie un User-Agent « Dart/x.y (dart:io) ».
const APP_UA = "Dart/%";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const daysParam = Number(new URL(request.url).searchParams.get("days"));
  const days = PERIODS.includes(daysParam) ? daysParam : 30;

  // Début de la période (minuit UTC, jour courant inclus) et de la période précédente
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const from = new Date(today.getTime() - (days - 1) * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);

  const [
    books,
    users,
    posts,
    categories,
    agg,
    pendingReviews,
    recentReviewsRaw,
    recentBooks,
    daily,
    prevTotal,
    topRaw,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.post.count(),
    prisma.category.count(),
    prisma.book.aggregate({ _sum: { downloadCount: true, viewCount: true } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { book: { select: { title: true, slug: true } } },
    }),
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, slug: true, title: true, author: true, isPublished: true },
    }),
    // Téléchargements par jour, séparés site web / application Android
    // ("createdAt" est stocké en UTC sans fuseau : to_char évite tout décalage)
    prisma.$queryRaw<{ day: string; web: bigint; app: bigint }[]>`
      SELECT to_char("createdAt", 'YYYY-MM-DD') AS day,
             COUNT(*) FILTER (WHERE "userAgent" IS NULL OR "userAgent" NOT LIKE ${APP_UA}) AS web,
             COUNT(*) FILTER (WHERE "userAgent" LIKE ${APP_UA}) AS app
      FROM "Download"
      WHERE "createdAt" >= ${from}
      GROUP BY 1`,
    prisma.download.count({ where: { createdAt: { gte: prevFrom, lt: from } } }),
    prisma.download.groupBy({
      by: ["bookId"],
      where: { createdAt: { gte: from } },
      _count: { _all: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 8,
    }),
  ]);

  // Série complète (jours sans téléchargement = 0)
  const byDay = new Map<string, { web: number; app: number }>();
  for (const r of daily) {
    byDay.set(r.day, {
      web: Number(r.web),
      app: Number(r.app),
    });
  }
  const series: { date: string; web: number; app: number; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(from.getTime() + i * DAY).toISOString().slice(0, 10);
    const v = byDay.get(date) ?? { web: 0, app: 0 };
    series.push({ date, ...v, count: v.web + v.app });
  }
  const periodWeb = series.reduce((s, d) => s + d.web, 0);
  const periodApp = series.reduce((s, d) => s + d.app, 0);

  const topBooksInfo = await prisma.book.findMany({
    where: { id: { in: topRaw.map((t) => t.bookId) } },
    select: { id: true, slug: true, title: true, author: true },
  });
  const infoById = new Map(topBooksInfo.map((b) => [b.id, b]));
  const topBooks = topRaw
    .map((t) => ({ ...infoById.get(t.bookId), count: t._count._all }))
    .filter((b) => b.id);

  const recentReviews = recentReviewsRaw.map((r) => ({
    id: r.id,
    bookTitle: r.book.title,
    bookSlug: r.book.slug,
    name: r.name ?? "Anonyme",
    rating: r.rating,
    comment: r.comment ?? "",
    isApproved: r.isApproved,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({
    books,
    users,
    posts,
    categories,
    downloadsTotal: agg._sum.downloadCount ?? 0,
    viewsTotal: agg._sum.viewCount ?? 0,
    pendingReviews,
    recentReviews,
    recentBooks,
    days,
    downloadsSeries: series,
    period: {
      total: periodWeb + periodApp,
      web: periodWeb,
      app: periodApp,
      previousTotal: prevTotal,
    },
    topBooks,
  });
}
