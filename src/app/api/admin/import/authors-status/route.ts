import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { slugify, formatAuthorName } from "@/lib/utils";
import { SUGGESTED_AUTHORS } from "@/lib/suggested-authors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface AuthorStatus {
  name: string;
  slug: string;
  inDb: number; // livres déjà en base pour cet auteur
  fullyImported: boolean; // puce « à jour »
}

// Statut d'import de chaque auteur suggéré : nombre de livres déjà téléchargés
// et drapeau « à jour » (plus rien de nouveau à importer).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // slug canonique par auteur suggéré (même règle que l'import)
  const entries = SUGGESTED_AUTHORS.map((name) => ({
    name,
    slug: slugify(formatAuthorName(name)),
  }));
  const slugs = entries.map((e) => e.slug);

  // Comptage des livres par authorSlug (une seule requête)
  const grouped = await prisma.book.groupBy({
    by: ["authorSlug"],
    where: { authorSlug: { in: slugs } },
    _count: { _all: true },
  });
  const counts = new Map<string, number>();
  for (const g of grouped) {
    if (g.authorSlug) counts.set(g.authorSlug, g._count._all);
  }

  // Drapeaux « à jour » depuis la table Author
  const authors = await prisma.author.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, fullyImported: true },
  });
  const done = new Map(authors.map((a) => [a.slug, a.fullyImported]));

  const statuses: AuthorStatus[] = entries.map((e) => ({
    name: e.name,
    slug: e.slug,
    inDb: counts.get(e.slug) ?? 0,
    fullyImported: done.get(e.slug) ?? false,
  }));

  return NextResponse.json({ authors: statuses });
}
