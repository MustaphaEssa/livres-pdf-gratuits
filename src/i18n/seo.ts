import { LOCALES, DEFAULT_LOCALE, X_DEFAULT_LOCALE, localizePath, type Locale } from "./config";

/**
 * Canonical + hreflang pour une page traduite dans toutes les langues.
 * `path` est le chemin SANS préfixe (« /catalogue »).
 */
export function i18nAlternates(locale: Locale, path: string, locales: readonly Locale[] = LOCALES) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizePath(l, path);
  // Version proposée aux visiteurs dont la langue n'est pas couverte : l'anglais.
  languages["x-default"] = localizePath(X_DEFAULT_LOCALE, path);
  return { canonical: localizePath(locale, path), languages };
}

/** Page dont le contenu n'existe qu'en français (article de blog, pages légales) : canonical vers le FR. */
export function frenchOnlyAlternates(path: string) {
  return { canonical: localizePath(DEFAULT_LOCALE, path) };
}

/**
 * Langues dans lesquelles une fiche livre est indexée : français, anglais et la
 * langue du livre. Les autres versions (un essai français en japonais…) n'ont que
 * l'interface de traduite : Google les voit comme des quasi-doublons et finit par
 * dévaluer tout le site (« Détectée, actuellement non indexée »). Elles restent
 * accessibles aux visiteurs, mais en noindex et hors sitemap.
 */
export function bookIndexLocales(language: string | null | undefined): Locale[] {
  const out: Locale[] = [DEFAULT_LOCALE, X_DEFAULT_LOCALE];
  const l = (language ?? "").toLowerCase().slice(0, 2);
  if ((LOCALES as readonly string[]).includes(l) && !out.includes(l as Locale)) out.push(l as Locale);
  return out;
}
