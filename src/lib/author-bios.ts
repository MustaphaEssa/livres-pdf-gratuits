// Biographies d'auteurs dans la langue de la page.
//
// Le français reste dans Author.bio ; les autres langues sont dans Author.bioI18n,
// remplies depuis l'article Wikipédia de chaque langue (même personne, retrouvée
// via les liens interlangues de l'article FR — ou EN si pas d'article FR).
import type { Locale } from "@/i18n/config";

const UA = "livrespdfgratuits.com (contact@livrespdfgratuits.com)";
const TARGETS = ["en", "es", "ar", "de", "it", "pt", "nl", "ru", "tr", "zh", "ja"] as const;
const MAX = 1200;

export type BioI18n = Partial<Record<Locale, string>>;

/** Bio à afficher pour une langue (null si aucune bio dans cette langue). */
export function localizedBio(
  locale: Locale,
  a: { bio: string | null; bioI18n?: unknown }
): string | null {
  if (locale === "fr") return a.bio;
  const map = (a.bioI18n && typeof a.bioI18n === "object" ? a.bioI18n : {}) as BioI18n;
  return map[locale] || null;
}

type WikiPage = { title?: string; extract?: string; langlinks?: { lang: string; title: string }[] };
type WikiResp = { query?: { pages?: WikiPage[] } };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Appel à l'API Wikipédia. Réessaie sur 429/5xx (limitation de débit) ;
 * lève une erreur si Wikipédia ne répond pas, pour ne pas confondre
 * « aucun article » et « requête refusée ».
 */
async function api(lang: string, params: Record<string, string>): Promise<WikiResp> {
  const qs = new URLSearchParams({ action: "query", format: "json", formatversion: "2", redirects: "1", ...params });
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${qs}`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) return (await res.json()) as WikiResp;
      if (res.status !== 429 && res.status < 500) throw new Error(`Wikipédia ${lang} : HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Wikipédia")) throw e;
    }
    await sleep(3000 * 2 ** attempt);
  }
  throw new Error(`Wikipédia ${lang} : pas de réponse (limitation de débit ?)`);
}

function clean(extract: string | undefined): string | null {
  const t = (extract ?? "").replace(/\s+\n/g, "\n").trim();
  if (t.length < 40) return null;
  return t.length > MAX ? t.slice(0, MAX).replace(/\s+\S*$/, "") + "…" : t;
}

/** Page source (FR, sinon EN) trouvée par recherche, avec ses liens interlangues. */
async function sourcePage(name: string) {
  for (const lang of ["fr", "en"]) {
    const d = await api(lang, {
      generator: "search",
      gsrsearch: name,
      gsrlimit: "1",
      prop: "langlinks|extracts",
      lllimit: "max",
      exintro: "1",
      explaintext: "1",
    });
    const page = d?.query?.pages?.[0];
    if (page?.title) {
      const links: Record<string, string> = {};
      for (const l of page.langlinks ?? []) links[l.lang] = l.title;
      links[lang] = page.title;
      return { lang, links, extract: page.extract };
    }
  }
  return null;
}

/**
 * Bios Wikipédia de l'auteur dans les 11 langues hors FR (celles qui existent).
 * Renvoie {} si l'auteur est introuvable.
 */
export async function fetchBioTranslations(name: string): Promise<BioI18n> {
  const src = await sourcePage(name);
  if (!src) return {};
  const out: BioI18n = {};
  for (const lang of TARGETS) {
    if (lang === src.lang) {
      const b = clean(src.extract);
      if (b) out[lang] = b;
      continue;
    }
    const title = src.links[lang];
    if (!title) continue;
    await sleep(400); // politesse envers l'API Wikipédia
    const d = await api(lang, { titles: title, prop: "extracts", exintro: "1", explaintext: "1" });
    const b = clean(d?.query?.pages?.[0]?.extract);
    if (b) out[lang] = b;
  }
  return out;
}
