import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { recomputeBookRating } from "@/lib/books";

export const runtime = "nodejs";

// Approuve / rejette un avis (puis recalcule la note du livre)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (typeof body.isApproved !== "boolean") {
    return NextResponse.json({ error: "Champ isApproved requis" }, { status: 400 });
  }

  const review = await prisma.review.update({
    where: { id },
    data: { isApproved: body.isApproved },
  });
  await recomputeBookRating(existing.bookId);

  return NextResponse.json({ ok: true, review });
}

// Supprime un avis (puis recalcule la note du livre)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }
  await prisma.review.delete({ where: { id } });
  await recomputeBookRating(existing.bookId);
  return NextResponse.json({ ok: true });
}
