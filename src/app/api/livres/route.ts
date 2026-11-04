import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// Liste des livres (depuis la base) — utilisée par l'admin et le dashboard.
export async function GET() {
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
