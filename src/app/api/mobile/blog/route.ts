import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/posts";
import { absUrl } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getPublishedPosts();
  return NextResponse.json({
    posts: posts.slice(0, 100).map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverUrl: absUrl(p.coverImage),
      author: p.author,
      publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    })),
  });
}
