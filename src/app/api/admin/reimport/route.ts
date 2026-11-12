import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { listHeavyBooks, reimportFromGutenberg } from "@/lib/gutenberg";

export const runtime = "nodejs";

// Liste les livres PDF les plus lourds (candidats au réimport léger).
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const minMb = Math.max(1, Number(searchParams.get("minMb")) || 5);
  // Pas de plafond serveur : on liste TOUS les livres lourds (le réimport côté
  // client les traite un par un, l'utilisateur garde l'onglet ouvert).
  const books = await listHeavyBooks(minMb * 1024 * 1024, 100000);
  return NextResponse.json({
    books: books.map((b) => ({ ...b, sizeMb: Math.round(((b.pdfSize ?? 0) / 1024 / 1024) * 10) / 10 })),
    total: books.length,
  });
}

// Réimporte UN livre en version légère depuis Gutenberg.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const bookId = String(body.bookId || "");
  if (!bookId) return NextResponse.json({ error: "bookId requis" }, { status: 400 });

  const res = await reimportFromGutenberg(bookId);
  const fmt = (n?: number | null) => (n ? Math.round((n / 1024 / 1024) * 10) / 10 : null);
  return NextResponse.json({ ...res, oldMb: fmt(res.oldSize), newMb: fmt(res.newSize) });
}
