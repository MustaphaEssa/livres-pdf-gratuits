import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getAllPosts, createPost, slugExistsPost } from "@/lib/posts";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const posts = await getAllPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  if (!title || !content) {
    return NextResponse.json(
      { error: "Titre et contenu sont requis" },
      { status: 400 }
    );
  }

  const slug = slugify(String(body.slug || title));
  if (await slugExistsPost(slug)) {
    return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });
  }

  const post = await createPost({
    title,
    slug,
    content,
    excerpt: String(body.excerpt || "") || null,
    author: String(body.author || "") || null,
    coverImage: String(body.coverImage || "") || null,
    categorySlug: String(body.categorySlug || "") || undefined,
    isPublished: body.isPublished !== false,
    isFeatured: body.isFeatured === true,
  });

  return NextResponse.json({ ok: true, post }, { status: 201 });
}
