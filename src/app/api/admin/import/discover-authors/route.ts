import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { slugify, formatAuthorName } from "@/lib/utils";
import { discoverGutenbergAuthors } from "@/lib/gutenberg";
import { SUGGESTED_AUTHORS } from "@/lib/suggested-authors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Auteurs du catalogue Gutenberg FR pas encore en base, triés par nombre
 * d'œuvres disponibles. Exclut ceux déjà proposés en dur (SUGGESTED_AUTHORS).
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const max = Math.min(Number(searchParams.get("max")) || 40, 100);
  const min = Math.max(Number(searchParams.get("min")) || 3, 1);

  // slugs des auteurs déjà listés manuellement (même règle de slug que l'import)
  const excludeSlugs = SUGGESTED_AUTHORS.map((n) => slugify(formatAuthorName(n)));

  try {
    const authors = await discoverGutenbergAuthors({ min, max, excludeSlugs });
    return NextResponse.json({ authors });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Échec du chargement du catalogue" },
      { status: 500 }
    );
  }
}
