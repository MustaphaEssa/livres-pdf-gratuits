// Langues des livres : libellés, sens d'écriture et ordre d'affichage.
// Utilisable côté serveur et côté client (aucune dépendance).

// Libellés fixes (nom de la langue dans la langue elle-même) pour les plus courantes
const KNOWN: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  ar: "العربية",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  la: "Latina",
  ru: "Русский",
  zh: "中文",
};

// Ordre préféré ; les autres langues suivent, triées par nombre de livres
const ORDER = ["fr", "en", "es", "ar", "de", "it", "pt"];

export const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

export const isLangCode = (v: string) => /^[a-z]{2,3}$/.test(v);

/** Nom d'une langue dans la langue elle-même (« Español », « Deutsch »…). */
export function languageLabel(code: string | null | undefined): string {
  if (!code) return "—";
  const c = code.toLowerCase();
  if (KNOWN[c]) return KNOWN[c];
  try {
    const name = new Intl.DisplayNames([c], { type: "language" }).of(c);
    if (name && name.toLowerCase() !== c) return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    /* code inconnu d'Intl */
  }
  return c.toUpperCase();
}

/** Trie des codes de langue : ordre préféré d'abord, puis par nombre de livres décroissant. */
export function sortLanguages<T extends { code: string; count: number }>(langs: T[]): T[] {
  const rank = (c: string) => {
    const i = ORDER.indexOf(c);
    return i === -1 ? ORDER.length : i;
  };
  return [...langs].sort((a, b) => rank(a.code) - rank(b.code) || b.count - a.count);
}
