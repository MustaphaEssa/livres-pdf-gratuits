import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import {
  getPostById,
  updatePost,
  deletePost,
  slugExistsPost,
  type PostInput,
} from "@/lib/posts";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const existing = await getPostById(id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const data: Partial<PostInput> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.content === "string" && body.content.trim()) data.content = body.content.trim();
  if (typeof body.excerpt === "string") data.excerpt = body.excerpt || null;
  if (typeof body.author === "string") data.author = body.author || null;
  if (typeof body.coverImage === "string") data.coverImage = body.coverImage || null;
  if (typeof body.categorySlug === "string") data.categorySlug = body.categorySlug;
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
  if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;

  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = slugify(body.slug);
    if (slug !== existing.slug) {
      if (await slugExistsPost(slug, id)) {
        return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });
      }
      data.slug = slug;
    }
  }

  const post = await updatePost(id, data);
  return NextResponse.json({ ok: true, post });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  try {
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
}
