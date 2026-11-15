import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { bad, getMobileUser, listSelect, readableWhere, serializeBook } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Favoris de l'utilisateur connecté
export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return bad("Connexion requise", 401);
  const favs = await prisma.favorite.findMany({
    where: { userId: user.sub, book: readableWhere },
    orderBy: { createdAt: "desc" },
    select: { book: { select: listSelect } },
  });
  return NextResponse.json({ books: favs.map((f) => serializeBook(f.book)) });
}

// Bascule un favori : { slug } → { favorited: boolean }
export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return bad("Connexion requise", 401);
  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return bad("Requête invalide");
  }
  if (!body.slug) return bad("slug requis");

  const book = await prisma.book.findFirst({
    where: { AND: [readableWhere, { slug: body.slug }] },
    select: { id: true },
  });
  if (!book) return bad("Livre introuvable", 404);

  const key = { userId_bookId: { userId: user.sub, bookId: book.id } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  await prisma.favorite.create({ data: { userId: user.sub, bookId: book.id } });
  return NextResponse.json({ favorited: true });
}
