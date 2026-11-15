import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { bad, getMobileUser, readableWhere } from "@/lib/mobile";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

// Dépose un avis (compte requis dans l'app)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getMobileUser(request);
  if (!user) return bad("Connexion requise", 401);

  const rl = rateLimit(`mobile-review:${user.sub}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return bad("Trop d'avis, réessayez plus tard", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Requête invalide");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Données invalides");

  const { slug } = await params;
  const book = await prisma.book.findFirst({
    where: { AND: [readableWhere, { slug }] },
    select: { id: true },
  });
  if (!book) return bad("Livre introuvable", 404);

  await prisma.review.create({
    data: {
      bookId: book.id,
      name: user.name,
      email: user.email,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      isApproved: true, // même règle que le site
    },
  });

  const agg = await prisma.review.aggregate({
    where: { bookId: book.id, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.book.update({
    where: { id: book.id },
    data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
