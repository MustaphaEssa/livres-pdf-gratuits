import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// Suggestions de la recherche de l'accueil : 6 livres max (titre ou auteur), les plus lus d'abord.
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ books: [] });

  try {
    const books = await prisma.book.findMany({
      where: {
        isPublished: true,
        mediaType: "PDF",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { slug: true, title: true, author: true, coverImage: true, language: true },
      orderBy: [{ downloadCount: "desc" }, { viewCount: "desc" }],
      take: 6,
    });
    return NextResponse.json(
      { books },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Erreur suggestions:", error);
    return NextResponse.json({ books: [] }, { status: 500 });
  }
}
