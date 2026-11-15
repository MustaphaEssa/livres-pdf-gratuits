import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  bad,
  detailSelect,
  getMobileUser,
  listSelect,
  readableWhere,
  serializeBook,
} from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fiche d'un livre + livres liés + avis approuvés (+ état favori si connecté)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const book = await prisma.book.findFirst({
    where: { AND: [readableWhere, { slug }] },
    select: detailSelect,
  });
  if (!book) return bad("Livre introuvable", 404);

  const catSlugs = book.categories.map((c) => c.category.slug);
  const user = await getMobileUser(request);

  const [sameAuthor, related, reviews, fav] = await Promise.all([
    book.authorSlug
      ? prisma.book.findMany({
          where: { AND: [readableWhere, { authorSlug: book.authorSlug, id: { not: book.id } }] },
          select: listSelect,
          orderBy: { downloadCount: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
    catSlugs.length
      ? prisma.book.findMany({
          where: {
            AND: [
              readableWhere,
              { id: { not: book.id }, categories: { some: { category: { slug: { in: catSlugs } } } } },
            ],
          },
          select: listSelect,
          orderBy: { downloadCount: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
    prisma.review.findMany({
      where: { bookId: book.id, isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, rating: true, comment: true, createdAt: true },
    }),
    user
      ? prisma.favorite.findUnique({
          where: { userId_bookId: { userId: user.sub, bookId: book.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  // Compteur de vues (best-effort, ne bloque jamais la réponse)
  prisma.book.update({ where: { id: book.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json({
    book: serializeBook(book),
    sameAuthor: sameAuthor.map(serializeBook),
    related: related.map(serializeBook),
    reviews,
    isFavorite: !!fav,
  });
}
