import { NextResponse } from "next/server";
import { getPublishedPostBySlug } from "@/lib/posts";
import { absUrl, bad } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedPostBySlug(slug);
  if (!p) return bad("Article introuvable", 404);
  return NextResponse.json({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverUrl: absUrl(p.coverImage),
    author: p.author,
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    paragraphs: p.content.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
  });
}
