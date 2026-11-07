import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { formatAuthorName, slugify } from "@/lib/utils";

export const runtime = "nodejs";

// Liste des auteurs (slug, nom, nombre de livres, présence d'une photo)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const groups = await prisma.book.groupBy({
    by: ["authorSlug", "author"],
    where: { authorSlug: { not: null } },
    _count: { _all: true },
  });

  // Consolide par slug (un slug peut avoir plusieurs variantes de nom)
  const bySlug = new Map<string, { slug: string; name: string; count: number }>();
  for (const g of groups) {
    const slug = g.authorSlug as string;
    const ex = bySlug.get(slug);
    if (ex) ex.count += g._count._all;
    else bySlug.set(slug, { slug, name: g.author, count: g._count._all });
  }

  const authors = await prisma.author.findMany({
    where: { slug: { in: Array.from(bySlug.keys()) } },
    select: { slug: true, name: true, image: true },
  });
  const profiles = new Map(authors.map((a) => [a.slug, a]));

  const list = Array.from(bySlug.values())
    .map((a) => {
      const p = profiles.get(a.slug);
      return {
        slug: a.slug,
        name: p?.name || formatAuthorName(a.name),
        count: a.count,
        hasImage: !!p?.image,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return NextResponse.json({ authors: list });
}

// Fusionne plusieurs auteurs en un seul (le "target")
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: { slugs?: string[]; targetSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const slugs = (body.slugs ?? []).filter(Boolean);
  const targetSlug = body.targetSlug;
  if (!targetSlug || slugs.length < 2 || !slugs.includes(targetSlug)) {
    return NextResponse.json(
      { error: "Sélectionnez au moins 2 auteurs et un auteur final valide." },
      { status: 400 }
    );
  }

  // Nom affichable canonique (depuis la fiche cible ou un de ses livres)
  const targetProfile = await prisma.author.findUnique({ where: { slug: targetSlug } });
  const targetBook = await prisma.book.findFirst({
    where: { authorSlug: targetSlug },
    select: { author: true },
  });
  const targetName = targetProfile?.name || formatAuthorName(targetBook?.author ?? targetSlug);
  const canonicalSlug = slugify(targetName) || targetSlug;

  // Réaffecte tous les livres des auteurs sélectionnés vers la cible
  const updated = await prisma.book.updateMany({
    where: { authorSlug: { in: slugs } },
    data: { authorSlug: canonicalSlug, author: targetName },
  });

  // Supprime les fiches auteurs orphelines (les non-cibles)
  await prisma.author.deleteMany({
    where: { slug: { in: slugs.filter((s) => s !== canonicalSlug) } },
  });
  // Met à jour le nom de la fiche cible (et son slug si recalculé)
  const existing = await prisma.author.findUnique({ where: { slug: targetSlug } });
  if (existing && existing.slug !== canonicalSlug) {
    await prisma.author.update({
      where: { slug: targetSlug },
      data: { slug: canonicalSlug, name: targetName },
    });
  } else if (existing) {
    await prisma.author.update({ where: { slug: targetSlug }, data: { name: targetName } });
  }

  return NextResponse.json({ ok: true, merged: slugs.length, booksMoved: updated.count, targetSlug: canonicalSlug });
}
