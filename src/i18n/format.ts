import type { Locale } from "./config";
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
