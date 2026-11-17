import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth-server";

export const runtime = "nodejs";

// Liste complète des livres (brouillons inclus) — réservée à l'admin.
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const books = await prisma.book.findMany({
      include: {
        categories: {
          include: { category: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(books);
  } catch (error) {
    console.error("Erreur récupération livres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des livres" },
      { status: 500 }
    );
  }
}
