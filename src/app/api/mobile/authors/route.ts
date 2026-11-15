import { NextResponse } from "next/server";
import { getAuthorsWithCounts } from "@/lib/books";
import { absUrl, intParam } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache mémoire 10 min : le calcul regroupe tout le catalogue.
let cache: { at: number; data: Awaited<ReturnType<typeof getAuthorsWithCounts>> } | null = null;

// Auteurs : /api/mobile/authors?q=&page=&limit=
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const q = (sp.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  const limit = intParam(sp.get("limit"), 40, 1, 100);

  if (!cache || Date.now() - cache.at > 10 * 60 * 1000) {
    cache = { at: Date.now(), data: await getAuthorsWithCounts() };
  }
  const all = q ? cache.data.filter((a) => a.name.toLowerCase().includes(q)) : cache.data;
  const totalPages = Math.max(1, Math.ceil(all.length / limit));
  const page = Math.min(intParam(sp.get("page"), 1, 1, 100000), totalPages);
  const slice = all.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    authors: slice.map((a) => ({
      slug: a.slug,
      name: a.name,
      count: a.count,
      imageUrl: absUrl(a.image),
    })),
    total: all.length,
    page,
    totalPages,
    hasMore: page < totalPages,
  });
}
