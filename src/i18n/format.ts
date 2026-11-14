import type { Locale } from "./config";
import { formatAuthorName } from "@/lib/utils";
import type { Plural } from "./messages/types";

/** Remplace les {placeholders} d'un message. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Locale Intl : l'arabe utilise les chiffres latins (usage marocain, ar-MA). */
export const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-MA" : locale);

const rulesCache = new Map<string, Intl.PluralRules>();

/** Choisit la forme plurielle selon les règles de la langue (ru, ar, pl… ont plusieurs pluriels). */
export function plural(locale: Locale, forms: Plural, n: number, vars: Record<string, string | number> = {}): string {
  let rules = rulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    rulesCache.set(locale, rules);
  }
  const cat = n === 0 && forms.zero ? "zero" : rules.select(n);
  const template = forms[cat as keyof Plural] ?? forms.other;
  return fmt(template, { n: formatNumber(locale, n), ...vars });
}

export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}

export function formatDateLocale(locale: Locale, date: Date | string): string {
  return new Date(date).toLocaleDateString(intlLocale(locale), { year: "numeric", month: "long", day: "numeric" });
}

/** Nom traduit d'un genre (par slug), sinon le nom en base. */
export function categoryLabel(
  t: { categories: Record<string, string> },
  cat: { slug?: string | null; name: string }
): string {
  return (cat.slug && t.categories[cat.slug]) || cat.name;
}

/** Nom de la marque dans la langue (« Livres PDF Gratuits », « Free PDF Books »…). */
export function brandName(t: { brand: { before: string; after: string } }): string {
  return [t.brand.before, "PDF", t.brand.after].filter(Boolean).join(" ");
}

/** Auteurs génériques saisis en base (« Auteur inconnu », « Anonyme »…), traduits à l'affichage. */
const GENERIC_AUTHOR = /^(auteur inconnu|inconnu|anonyme|anonymous|unknown|unknown author)$/i;

/** Nom d'auteur affichable : « Hugo, Victor » → « Victor Hugo », générique → libellé traduit. */
export function authorLabel(t: { common: { unknownAuthor: string } }, raw: string): string {
  const name = formatAuthorName(raw);
  return GENERIC_AUTHOR.test(name.trim()) ? t.common.unknownAuthor : name;
}

/** Note de collection affichable : remplissage générique traduit, sinon texte réel s'il est exploitable. */
export function collectionNote(
  t: { collections: { fallbackNotes: string[] } },
  frFallbacks: string[],
  note: string | null | undefined,
  useful: (s: string) => boolean
): string | null {
  if (!note) return null;
  const i = frFallbacks.indexOf(note.trim());
  if (i >= 0) return t.collections.fallbackNotes[i] ?? null;
  return useful(note) ? note : null;
}
