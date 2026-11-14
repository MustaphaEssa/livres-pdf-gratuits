// Langues de l'interface publique. Le français est la langue par défaut et reste
// SANS préfixe d'URL (/catalogue) pour conserver les URLs déjà indexées ;
// les autres langues sont préfixées (/en/catalogue, /ar/livre/…).
// L'admin reste en français.

import { toInternalSegments, toPublicSegments } from "./segments";

export const LOCALES = ["fr", "en", "es", "ar", "de", "it", "pt", "nl", "ru", "tr", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

/** Langue « par défaut » annoncée à Google (hreflang x-default) et proposée aux visiteurs
 *  dont la langue du navigateur n'est pas couverte. */
export const X_DEFAULT_LOCALE: Locale = "en";

/** Cookie posé par le sélecteur : choix explicite de langue, prioritaire sur le navigateur. */
export const LOCALE_COOKIE = "locale";

/** En-tête posé par le middleware pour transmettre la langue de l'URL aux pages. */
export const LOCALE_HEADER = "x-locale";

export const LOCALE_INFO: Record<Locale, { label: string; flag: string; og: string }> = {
  fr: { label: "Français", flag: "🇫🇷", og: "fr_FR" },
  en: { label: "English", flag: "🇬🇧", og: "en_US" },
  es: { label: "Español", flag: "🇪🇸", og: "es_ES" },
  ar: { label: "العربية", flag: "🇲🇦", og: "ar_AR" },
  de: { label: "Deutsch", flag: "🇩🇪", og: "de_DE" },
  it: { label: "Italiano", flag: "🇮🇹", og: "it_IT" },
  pt: { label: "Português", flag: "🇵🇹", og: "pt_PT" },
  nl: { label: "Nederlands", flag: "🇳🇱", og: "nl_NL" },
  ru: { label: "Русский", flag: "🇷🇺", og: "ru_RU" },
  tr: { label: "Türkçe", flag: "🇹🇷", og: "tr_TR" },
  zh: { label: "中文", flag: "🇨🇳", og: "zh_CN" },
  ja: { label: "日本語", flag: "🇯🇵", og: "ja_JP" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// Chemins jamais localisés (fichiers, API, admin, routes techniques)
const UNLOCALIZED = /^\/(api|admin|uploads|_next)(\/|$)/;

// Sépare « /chemin » de « ?query#hash »
function splitSuffix(href: string): [string, string] {
  const i = href.search(/[?#]/);
  return i === -1 ? [href, ""] : [href.slice(0, i) || "/", href.slice(i)];
}

/**
 * Chemin interne → URL publique de la langue, avec préfixe et segments traduits :
 * « /livre/x/lire » → « /en/book/x/read », « /de/buch/x/lesen »… (français : inchangé).
 * Accepte aussi un chemin déjà localisé (il est d'abord ramené au chemin interne).
 */
export function localizePath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//") || UNLOCALIZED.test(href)) return href;
  const [path, suffix] = splitSuffix(stripLocale(href));
  if (locale === DEFAULT_LOCALE) return path + suffix;
  if (path === "/") return `/${locale}${suffix}`;
  return `/${locale}${toPublicSegments(locale, path)}${suffix}`;
}

/**
 * Retire le préfixe de langue ET retraduit les segments vers la route interne :
 * « /en/book/x » → « /livre/x ». Un chemin sans préfixe est renvoyé tel quel.
 */
export function stripLocale(href: string): string {
  const m = href.match(/^\/([a-z]{2})(?=\/|\?|#|$)/);
  if (!m || !isLocale(m[1])) return href;
  const rest = href.slice(3);
  const [path, suffix] = splitSuffix(rest.startsWith("/") ? rest : `/${rest}`);
  return toInternalSegments(m[1], path) + suffix;
}

/** Langue portée par un chemin (« /en/… » → "en"), sinon la langue par défaut. */
export function localeFromPath(path: string): Locale {
  const m = path.match(/^\/([a-z]{2})(?=\/|\?|#|$)/);
  return m && isLocale(m[1]) ? m[1] : DEFAULT_LOCALE;
}

/**
 * Langue préférée d'après l'en-tête Accept-Language.
 * Première langue couverte par ordre de préférence ; si aucune ne l'est, ou si le
 * navigateur ne déclare aucune langue : l'anglais (langue par défaut des visiteurs).
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return X_DEFAULT_LOCALE;
  const tags = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? parseFloat(q.split("=")[1]) || 0 : 1, i };
    })
    .filter((t) => t.lang && t.lang !== "*" && t.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  if (!tags.length) return X_DEFAULT_LOCALE;
  const hit = tags.find((t) => isLocale(t.lang));
  return hit ? (hit.lang as Locale) : X_DEFAULT_LOCALE;
}
