import prisma from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, X_DEFAULT_LOCALE, isLocale, localizePath, type Locale } from "@/i18n/config";

// Sitemaps XML écrits à la main (plutôt que app/sitemap.ts) pour :
//  - un index /sitemap.xml → /sitemaps/{langue}-{n}.xml ;
//  - lister CHAQUE version linguistique comme <url> à part entière, avec le jeu
//    complet de <xhtml:link hreflang> (exigence de Google pour les alternates) ;
//  - découper automatiquement au-delà de CHUNK URLs (limite Google : 50 000).

export const CHUNK = 40_000;

type Freq = "daily" | "weekly" | "monthly" | "yearly";
interface Entry {
  path: string;
  lastmod?: Date;
  freq: Freq;
  priority: number;
  /** false : page en français uniquement (blog, pages légales) */
  i18n: boolean;
}

let cache: { at: number; entries: Entry[] } | null = null;
const TTL = 60 * 60 * 1000;

/** Toutes les pages indexables (chemins internes, non localisés). */
export async function sitemapEntries(): Promise<Entry[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.entries;
  const now = new Date();
  const entries: Entry[] = [
    { path: "/", freq: "daily", priority: 1, i18n: true, lastmod: now },
    { path: "/catalogue", freq: "daily", priority: 0.9, i18n: true, lastmod: now },
    { path: "/livres-audio", freq: "daily", priority: 0.8, i18n: true, lastmod: now },
    { path: "/auteurs", freq: "weekly", priority: 0.8, i18n: true },
    { path: "/collections", freq: "weekly", priority: 0.7, i18n: true },
    { path: "/blog", freq: "weekly", priority: 0.6, i18n: true },
    { path: "/a-propos", freq: "yearly", priority: 0.4, i18n: true },
    { path: "/contact", freq: "yearly", priority: 0.3, i18n: true },
    ...["/confidentialite", "/mentions-legales", "/conditions", "/dmca"].map(
      (path): Entry => ({ path, freq: "yearly", priority: 0.2, i18n: false })
    ),
  ];
  try {
    const [books, categories, authors, posts, collections] = await Promise.all([
      prisma.book.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.category.findMany({
        where: { type: "BOOK", books: { some: { book: { isPublished: true } } } },
        select: { slug: true },
      }),
      prisma.book.groupBy({
        by: ["authorSlug"],
        where: { isPublished: true, authorSlug: { not: null } },
        _max: { updatedAt: true },
      }),
      prisma.post.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
      prisma.collection.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    ]);
    for (const c of categories) entries.push({ path: `/categorie/${c.slug}`, freq: "weekly", priority: 0.7, i18n: true });
    for (const c of collections)
      entries.push({ path: `/collections/${c.slug}`, lastmod: c.updatedAt, freq: "weekly", priority: 0.6, i18n: true });
    for (const a of authors) {
      if (!a.authorSlug) continue;
      entries.push({
        path: `/auteur/${a.authorSlug}`,
        lastmod: a._max.updatedAt ?? undefined,
        freq: "weekly",
        priority: 0.6,
        i18n: true,
      });
    }
    for (const b of books)
      entries.push({ path: `/livre/${b.slug}`, lastmod: b.updatedAt, freq: "monthly", priority: 0.8, i18n: true });
    for (const p of posts)
      entries.push({ path: `/blog/${p.slug}`, lastmod: p.updatedAt, freq: "monthly", priority: 0.5, i18n: false });
  } catch (e) {
    console.error("sitemap: échec de récupération des données dynamiques", e);
    return entries; // pas de cache : on réessaiera au prochain appel
  }
  cache = { at: Date.now(), entries };
  return entries;
}

/** Entrées présentes dans le sitemap d'une langue. */
async function localeEntries(locale: Locale): Promise<Entry[]> {
  const all = await sitemapEntries();
  return locale === DEFAULT_LOCALE ? all : all.filter((e) => e.i18n);
}

/** Liste des fichiers du sitemap : « fr-0.xml », « en-0.xml »… */
export async function sitemapFiles(): Promise<string[]> {
  const all = await sitemapEntries();
  const i18nCount = all.filter((e) => e.i18n).length;
  const files: string[] = [];
  for (const l of LOCALES) {
    const count = l === DEFAULT_LOCALE ? all.length : i18nCount;
    const chunks = Math.max(1, Math.ceil(count / CHUNK));
    for (let i = 0; i < chunks; i++) files.push(`${l}-${i}.xml`);
  }
  return files;
}

const XML_ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => XML_ESC[c]);

function abs(path: string): string {
  if (path === "/") return SITE_URL;
  let p = path;
  try {
    p = encodeURI(decodeURI(path));
  } catch {
    p = encodeURI(path);
  }
  return `${SITE_URL}${p}`;
}

/** XML d'un fichier « {langue}-{n}.xml », ou null s'il n'existe pas. */
export async function sitemapXml(file: string): Promise<string | null> {
  const m = file.match(/^([a-z]{2})-(\d+)\.xml$/);
  if (!m || !isLocale(m[1])) return null;
  const locale = m[1];
  const index = Number(m[2]);
  const entries = (await localeEntries(locale)).slice(index * CHUNK, (index + 1) * CHUNK);
  if (!entries.length && index > 0) return null;

  const urls = entries.map((e) => {
    const lines = [`<loc>${esc(abs(localizePath(locale, e.path)))}</loc>`];
    if (e.i18n) {
      for (const l of LOCALES)
        lines.push(`<xhtml:link rel="alternate" hreflang="${l}" href="${esc(abs(localizePath(l, e.path)))}"/>`);
      lines.push(
        `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(abs(localizePath(X_DEFAULT_LOCALE, e.path)))}"/>`
      );
    }
    if (e.lastmod) lines.push(`<lastmod>${e.lastmod.toISOString()}</lastmod>`);
    lines.push(`<changefreq>${e.freq}</changefreq>`, `<priority>${e.priority.toFixed(1)}</priority>`);
    return `<url>${lines.join("")}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

/** Index des sitemaps (/sitemap.xml). */
export async function sitemapIndexXml(): Promise<string> {
  const [files, all] = await Promise.all([sitemapFiles(), sitemapEntries()]);
  const last = all.reduce<Date | undefined>((m, e) => (e.lastmod && (!m || e.lastmod > m) ? e.lastmod : m), undefined);
  const items = files.map(
    (f) => `<sitemap><loc>${SITE_URL}/sitemaps/${f}</loc>${last ? `<lastmod>${last.toISOString()}</lastmod>` : ""}</sitemap>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>\n`;
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
};
