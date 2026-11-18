import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { findDuplicateGroups } from "@/lib/duplicates";
import { deleteBookFiles } from "@/lib/cleanup";

export const runtime = "nodejs";

// GET : liste des groupes de doublons (identiques + similaires). Aucune suppression.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const groups = await findDuplicateGroups();
  const exact = groups.filter((g) => g.kind === "exact");
  return NextResponse.json({
    groups,
    exactGroups: exact.length,
    similarGroups: groups.length - exact.length,
    suggested: groups.reduce(
      (n, g) => n + g.books.filter((b) => b.hasExact && !b.isKeeper).length,
      0
    ),
  });
}

// POST { ids: string[] } : supprime les livres choisis (ligne en base + fichiers locaux).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 500)
    : [];
  if (!ids.length) return NextResponse.json({ error: "Aucun livre sélectionné" }, { status: 400 });

  const books = await prisma.book.findMany({
    where: { id: { in: ids } },
    select: { id: true, pdfUrl: true, coverImage: true },
  });

  let deleted = 0;
  for (const b of books) {
    try {
      await prisma.book.delete({ where: { id: b.id } }); // cascade : catégories, avis, favoris…
      deleted++;
      // Fichiers locaux uniquement (jamais d'URL externe)
      await deleteBookFiles(
        b.pdfUrl?.startsWith("/uploads/") ? b.pdfUrl : null,
        b.coverImage?.startsWith("/uploads/") ? b.coverImage : null
      );
    } catch {
      /* livre déjà supprimé ou contrainte : ignoré */
    }
  }

  return NextResponse.json({ deleted, skipped: ids.length - deleted });
}
