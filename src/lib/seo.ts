import type { Metadata } from "next";
import { LOCALES, LOCALE_INFO, localizePath, type Locale } from "@/i18n/config";
import { i18nAlternates } from "@/i18n/seo";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// Métadonnées communes à toutes les pages publiques : title, description,
// canonical + hreflang, Open Graph et Twitter Card cohérents.
//
// Sans ce helper, les pages qui ne redéfinissent pas `openGraph` héritent de
// celui du layout (og:url = accueil, og:title = titre par défaut) : Facebook,
// WhatsApp, LinkedIn… affichaient alors l'accueil pour chaque lien partagé.

/** Au-delà de cette page, les listes paginées passent en noindex,follow. */
export const MAX_INDEXED_PAGE = 5;

export const DEFAULT_OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630 };

/** Rend une URL d'image absolue (les couvertures locales sont en /uploads/…). */
export function absoluteUrl(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Ajoute ?page=N au chemin (page 1 = chemin nu). */
export function withPage(path: string, page: number): string {
  if (page <= 1) return path;
  return `${path}${path.includes("?") ? "&" : "?"}page=${page}`;
}

interface PageMetaInput {
  locale: Locale;
  /** Chemin interne non localisé (« /categorie/roman », « /catalogue?page=2 »). */
  path: string;
  title: string;
  description: string;
  /** Titre complet, sans le suffixe « | Nom du site » du layout. */
  absoluteTitle?: boolean;
  /** Nom du site affiché (og:site_name). */
  siteName?: string;
  image?: { url: string; width?: number; height?: number; alt?: string };
  type?: "website" | "book" | "profile" | "article";
  noindex?: boolean;
  /** Remplace canonical/hreflang (ex. page en français uniquement). */
  alternates?: Metadata["alternates"];
  /** Champs Open Graph spécifiques (book:author…). */
  openGraphExtra?: Record<string, unknown>;
}

export function pageMetadata(o: PageMetaInput): Metadata {
  const url = `${SITE_URL}${localizePath(o.locale, o.path)}`;
  const image = o.image ?? { ...DEFAULT_OG_IMAGE, alt: o.siteName ?? SITE_NAME };
  const images = [{ ...image, url: absoluteUrl(image.url) }];
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: o.alternates ?? i18nAlternates(o.locale, o.path),
    openGraph: {
      type: o.type ?? "website",
      url,
      title: o.title,
      description: o.description,
      siteName: o.siteName ?? SITE_NAME,
      locale: LOCALE_INFO[o.locale].og,
      alternateLocale: LOCALES.filter((l) => l !== o.locale).map((l) => LOCALE_INFO[l].og),
      images,
      ...(o.openGraphExtra ?? {}),
    },
    twitter: {
      card: "summary_large_image",
      title: o.title,
      description: o.description,
      images: images.map((i) => i.url),
    },
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Coupe une chaîne au dernier mot entier avant `max` caractères (avec « … »). */
export function clip(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1).replace(/[\s,;:.\-–—]+\S*$/, "");
  return `${cut || clean.slice(0, max - 1)}…`;
}

/**
 * Meta description de 160 caractères max se terminant par un appel à l'action :
 * « <texte tronqué> <CTA> ». Si le texte est très court, il est gardé entier.
 */
export function descriptionWithCta(text: string, cta: string, max = 160): string {
  const base = text.replace(/\s+/g, " ").trim();
  const room = max - cta.length - 1;
  if (room < 40) return clip(base, max);
  if (base.length <= room) return `${base} ${cta}`;
  // Coupe de préférence à la fin d'une phrase plutôt qu'au milieu
  const sentence = base.slice(0, room + 1).match(/^[\s\S]*[.!?。！？](?=\s|$)/)?.[0];
  if (sentence && sentence.length >= room * 0.5) return `${sentence} ${cta}`;
  return `${clip(base, room)} ${cta}`;
}

/** Remplace {clé} dans un gabarit (un {titles} vide retire aussi son « : » d'introduction). */
export function tpl(template: string, vars: Record<string, string | number>): string {
  const t = vars.titles === "" ? template.replace(/\s*[:：]\s*\{titles\}/, "") : template;
  return t.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Liste de titres « A, B, C » qui tient dans `max` caractères (titres principaux, sans sous-titre). */
export function titleList(titles: string[], max = 70): string {
  const out: string[] = [];
  let len = 0;
  for (const raw of titles) {
    const main = raw.split(/\s*[:;/(\[]\s*|\s+[-–—]\s+/)[0].replace(/\s+/g, " ").trim();
    if (main.length < 2 || main.length > 45 || out.includes(main)) continue;
    if (len + main.length + 2 > max) break;
    out.push(main);
    len += main.length + 2;
  }
  return out.join(", ");
}
