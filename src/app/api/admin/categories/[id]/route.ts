import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const data: { name?: string; slug?: string; description?: string | null; type?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.description === "string") data.description = body.description || null;
  if (body.type === "BOOK" || body.type === "BLOG") data.type = body.type;

  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = slugify(body.slug);
    if (slug !== existing.slug) {
      if (await prisma.category.count({ where: { slug, id: { not: id } } })) {
        return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });
      }
      data.slug = slug;
    }
  }

  const category = await prisma.category.update({ where: { id }, data });
  return NextResponse.json({ ok: true, category });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  try {
    // Les liens livre-catégorie sont supprimés en cascade ; les livres restent.
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }
}
