import { LOCALES, DEFAULT_LOCALE, X_DEFAULT_LOCALE, localizePath, type Locale } from "./config";

/**
 * Canonical + hreflang pour une page traduite dans toutes les langues.
 * `path` est le chemin SANS préfixe (« /catalogue »).
 */
export function i18nAlternates(locale: Locale, path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = localizePath(l, path);
  // Version proposée aux visiteurs dont la langue n'est pas couverte : l'anglais.
  languages["x-default"] = localizePath(X_DEFAULT_LOCALE, path);
  return { canonical: localizePath(locale, path), languages };
}

/** Page dont le contenu n'existe qu'en français (article de blog, pages légales) : canonical vers le FR. */
export function frenchOnlyAlternates(path: string) {
  return { canonical: localizePath(DEFAULT_LOCALE, path) };
}
