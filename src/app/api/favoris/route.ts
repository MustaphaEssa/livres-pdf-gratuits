import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// Liste des favoris de l'utilisateur connecté
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      book: {
        include: {
          categories: { include: { category: { select: { name: true, slug: true } } } },
        },
      },
    },
  });
  return NextResponse.json({ favorites: favorites.map((f) => f.book) });
}

// Bascule un favori { bookId }
export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  let body: { bookId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!body.bookId) {
    return NextResponse.json({ error: "bookId requis" }, { status: 400 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_bookId: { userId: session.sub, bookId: body.bookId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  await prisma.favorite.create({
    data: { userId: session.sub, bookId: body.bookId },
  });
  return NextResponse.json({ favorited: true });
}
