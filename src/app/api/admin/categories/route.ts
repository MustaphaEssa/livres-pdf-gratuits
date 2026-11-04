import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

// Liste des catégories avec le nombre de livres
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true, posts: true } } },
  });
  return NextResponse.json({ categories });
}

// Création d'une catégorie
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }
  const slug = slugify(String(body.slug || name));
  if (!slug) {
    return NextResponse.json({ error: "Slug invalide" }, { status: 400 });
  }
  if (await prisma.category.count({ where: { slug } })) {
    return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });
  }

  const type = body.type === "BLOG" ? "BLOG" : "BOOK";
  const category = await prisma.category.create({
    data: {
      name,
      slug,
      type,
      description: String(body.description || "") || null,
    },
  });
  return NextResponse.json({ ok: true, category }, { status: 201 });
}
