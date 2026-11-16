import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { bad, getMobileUser } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vérifie le jeton et renvoie le profil (l'app l'appelle au démarrage).
export async function GET(request: Request) {
  const session = await getMobileUser(request);
  if (!session) return bad("Non connecté", 401);
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user || !user.isActive) return bad("Non connecté", 401);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}

// Suppression du compte (exigée par Google Play pour les apps avec création de compte).
export async function DELETE(request: Request) {
  const session = await getMobileUser(request);
  if (!session) return bad("Non connecté", 401);
  const user = await prisma.user.findUnique({ where: { id: session.sub }, select: { email: true } });
  if (user) {
    // Les avis ne sont pas reliés au compte (nom + e-mail copiés) : on les supprime aussi,
    // puis on recalcule la note des livres concernés.
    const reviews = await prisma.review.findMany({
      where: { email: user.email },
      select: { bookId: true },
    });
    await prisma.review.deleteMany({ where: { email: user.email } });
    for (const bookId of new Set(reviews.map((r) => r.bookId))) {
      const agg = await prisma.review.aggregate({
        where: { bookId, isApproved: true },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.book.update({
        where: { id: bookId },
        data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
      });
    }
  }
  await prisma.user.delete({ where: { id: session.sub } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
