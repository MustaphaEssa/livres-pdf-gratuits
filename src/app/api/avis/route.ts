import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-server";

export const runtime = "nodejs";

// Liste des avis approuvés d'un livre : /api/avis?bookId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) {
    return NextResponse.json({ error: "bookId requis" }, { status: 400 });
  }
  const reviews = await prisma.review.findMany({
    where: { bookId, isApproved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, rating: true, comment: true, createdAt: true },
  });
  return NextResponse.json({ reviews });
}

const reviewSchema = z.object({
  bookId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  name: z.string().trim().max(80).optional(),
});

// Dépose un avis (utilisateur connecté ou visiteur avec nom)
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const book = await prisma.book.findUnique({ where: { id: parsed.data.bookId } });
  if (!book) {
    return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
  }

  // Nom : session utilisateur en priorité, sinon champ fourni
  const session = await getUserSession();
  const name = session?.name || parsed.data.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Veuillez indiquer votre nom" },
      { status: 400 }
    );
  }

  await prisma.review.create({
    data: {
      bookId: parsed.data.bookId,
      name,
      email: session?.email ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      isApproved: true, // auto-approuvé (modération possible plus tard)
    },
  });

  // Recalcule la note moyenne du livre
  const agg = await prisma.review.aggregate({
    where: { bookId: parsed.data.bookId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.book.update({
    where: { id: parsed.data.bookId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
