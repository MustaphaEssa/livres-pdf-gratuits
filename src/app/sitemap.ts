import type { MetadataRoute } from "next";
import prisma from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { LOCALES, X_DEFAULT_LOCALE, localizePath } from "@/i18n/config";

// hreflang : chaque page traduite pointe vers ses 12 versions linguistiques.
// (Articles de blog et pages légales : français uniquement, pas d'alternatives.)
function i18n(path: string) {
  const abs = (p: string) => (p === "/" ? SITE_URL : `${SITE_URL}${p}`);
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = abs(localizePath(l, path));
  languages["x-default"] = abs(localizePath(X_DEFAULT_LOCALE, path));
  return { url: abs(path), alternates: { languages } };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Données dynamiques : en cas d'erreur (base indisponible ou schéma pas
  // encore synchronisé au moment du build), on se rabat sur les routes
  // statiques plutôt que de faire échouer tout le build.
  let books: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];
  let posts: { slug: string; updatedAt: Date }[] = [];
  let authors: { authorSlug: string | null }[] = [];
  let collections: { slug: string; updatedAt: Date }[] = [];

  try {
    [books, categories, posts, authors] = await Promise.all([
      prisma.book.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { type: "BOOK" },
        select: { slug: true },
      }),
      prisma.post.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.book.findMany({
        where: { isPublished: true, authorSlug: { not: null } },
        select: { authorSlug: true },
        distinct: ["authorSlug"],
      }),
    ]);
    collections = await prisma.collection.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
  } catch (e) {
    console.error("sitemap: échec de récupération des données dynamiques", e);
  }

  // Pages principales
  const mainRoutes: MetadataRoute.Sitemap = [
    { p: "", priority: 1, freq: "daily" as const },
    { p: "/catalogue", priority: 0.9, freq: "daily" as const },
    { p: "/livres-audio", priority: 0.8, freq: "daily" as const },
    { p: "/collections", priority: 0.7, freq: "weekly" as const },
    { p: "/auteurs", priority: 0.8, freq: "weekly" as const },
    { p: "/blog", priority: 0.7, freq: "weekly" as const },
    { p: "/a-propos", priority: 0.5, freq: "monthly" as const },
    { p: "/contact", priority: 0.5, freq: "monthly" as const },
  ].map(({ p, priority, freq }) => ({
    ...i18n(p || "/"),
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));

  // Pages légales (faible priorité)
  const legalRoutes: MetadataRoute.Sitemap = [
    "/confidentialite",
    "/mentions-legales",
    "/conditions",
    "/dmca",
  ].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "yearly",
    priority: 0.2,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    ...i18n(`/categorie/${c.slug}`),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors
    .filter((a) => a.authorSlug)
    .map((a) => ({
      ...i18n(`/auteur/${a.authorSlug}`),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const bookRoutes: MetadataRoute.Sitemap = books.map((b) => ({
    ...i18n(`/livre/${b.slug}`),
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
    ...i18n(`/collections/${c.slug}`),
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...mainRoutes,
    ...legalRoutes,
    ...categoryRoutes,
    ...authorRoutes,
    ...bookRoutes,
    ...postRoutes,
    ...collectionRoutes,
  ];
}
