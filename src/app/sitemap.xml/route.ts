import { sitemapIndexXml, XML_HEADERS } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

// Index des sitemaps : un fichier par langue (découpé si > 40 000 URLs).
export async function GET() {
  return new Response(await sitemapIndexXml(), { headers: XML_HEADERS });
}
