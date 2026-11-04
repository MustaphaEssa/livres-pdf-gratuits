import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [
    books,
    users,
    posts,
    categories,
    downloads,
    agg,
    pendingReviews,
    recentReviewsRaw,
    recentDownloads,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.post.count(),
    prisma.category.count(),
    prisma.download.count(),
    prisma.book.aggregate({ _sum: { downloadCount: true, viewCount: true } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { book: { select: { title: true, slug: true } } },
    }),
    // Téléchargements des 14 derniers jours (pour la courbe du dashboard)
    prisma.download.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),
  ]);

  // Agrège les téléchargements par jour sur 14 jours (séries complètes, 0 inclus)
  const series: { date: string; count: number }[] = [];
  const byDay = new Map<string, number>();
  for (const d of recentDownloads) {
    const key = d.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    series.push({ date: day, count: byDay.get(day) ?? 0 });
  }

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
    downloadsLogged: downloads,
    downloadsTotal: agg._sum.downloadCount ?? 0,
    viewsTotal: agg._sum.viewCount ?? 0,
    pendingReviews,
    recentReviews,
    downloadsSeries: series,
  });
}
