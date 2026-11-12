import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { findMergeGroups, mergeGroup, mergeAllGroups } from "@/lib/merge-books";

export const runtime = "nodejs";

// Aperçu : liste les groupes de livres (même œuvre) fusionnables.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const groups = await findMergeGroups();
  return NextResponse.json({
    groups,
    total: groups.length,
    duplicates: groups.reduce((s, g) => s + (g.books.length - 1), 0),
  });
}

// Applique la fusion : tout, ou un groupe précis (bookIds).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    /* body optionnel */
  }

  if (Array.isArray(body.bookIds) && body.bookIds.length >= 2) {
    const res = await mergeGroup(body.bookIds.map(String));
    return NextResponse.json({ ok: !!res, ...res });
  }

  const res = await mergeAllGroups();
  return NextResponse.json({ ok: true, ...res });
}
