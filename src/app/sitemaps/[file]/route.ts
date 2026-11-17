import { sitemapXml, XML_HEADERS } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const xml = await sitemapXml(file);
  if (!xml) return new Response("Not found", { status: 404 });
  return new Response(xml, { headers: XML_HEADERS });
}
