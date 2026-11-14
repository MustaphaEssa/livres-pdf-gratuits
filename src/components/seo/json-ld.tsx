import { SITE_URL, SITE_NAME } from "@/lib/site";
import { DEFAULT_LOCALE, localizePath, type Locale } from "@/i18n/config";

const abs = (locale: Locale, url: string) => (url.startsWith("http") ? url : `${SITE_URL}${localizePath(locale, url)}`);

/**
 * Rend un ou plusieurs blocs JSON-LD (schema.org) dans la page.
 * Passez un objet unique ou un tableau d'objets.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

/* ---------- Constructeurs réutilisables ---------- */

type Crumb = { name: string; url: string };

/** Fil d'Ariane structuré. `url` peut être relatif (préfixé par SITE_URL). */
export function breadcrumbLd(crumbs: Crumb[], locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(locale, c.url),
    })),
  };
}

type ListBook = { slug: string; title: string };

/** Liste ordonnée de livres (ItemList) pointant vers leurs fiches. */
export function itemListLd(books: ListBook[], name?: string, locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(name ? { name } : {}),
    numberOfItems: books.length,
    itemListElement: books.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(locale, `/livre/${b.slug}`),
      name: b.title,
    })),
  };
}

/** Schéma du site + boîte de recherche sitelinks (SearchAction). */
export function websiteLd(locale: Locale = DEFAULT_LOCALE) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: abs(locale, "/"),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${abs(locale, "/catalogue")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Schéma de l'organisation éditrice. */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
  };
}
