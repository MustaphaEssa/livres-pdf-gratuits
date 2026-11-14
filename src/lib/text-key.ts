// Clé de comparaison de textes (titres, auteurs) pour repérer les doublons.
// Utilisable côté serveur et côté client (aucune dépendance).
//
// Deux textes qui ne diffèrent que par la casse (MAJUSCULES / minuscules), les
// accents, la ponctuation, les espaces ou les ligatures donnent la même clé :
//   "LES MISÉRABLES"  ≡  "Les Misérables."  ≡  "les  miserables"
// Fonctionne pour toutes les écritures (latin, cyrillique, arabe, CJK…) : les
// lettres non latines sont conservées au lieu d'être supprimées.

const LIGATURES: Record<string, string> = { œ: "oe", æ: "ae", ß: "ss", ĳ: "ij", ﬁ: "fi", ﬂ: "fl" };

export function matchKey(s: string | null | undefined): string {
  return (s || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // accents et signes diacritiques
    .toLocaleLowerCase("und")
    .replace(/[œæßĳﬁﬂ]/g, (c) => LIGATURES[c] ?? c)
    .replace(/[^\p{L}\p{N}]+/gu, " ") // ponctuation / symboles → espace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clé de titre : comme matchKey, en retirant une mention finale de l'auteur
 * (« Les Misérables par Victor Hugo », « Hamlet by William Shakespeare »).
 */
export function titleKey(title: string | null | undefined, author?: string | null): string {
  const t = matchKey(title);
  const a = matchKey(author);
  if (!a) return t;
  const parts = a.split(" ");
  const variants = new Set([a, parts.slice().reverse().join(" "), parts[parts.length - 1]]);
  for (const v of variants) {
    for (const sep of ["par", "by", "de", "von", "di", "door"]) {
      const suffix = ` ${sep} ${v}`;
      if (v && t.endsWith(suffix) && t.length > suffix.length) return t.slice(0, -suffix.length).trim();
    }
  }
  return t;
}

/** Clé d'auteur : ordre « Nom, Prénom » ramené à « prénom nom ». */
export function authorKey(author: string | null | undefined): string {
  const raw = (author || "").trim();
  // "Hugo, Victor, 1802-1885" → "Victor Hugo"
  const m = raw.match(/^([^,]+),\s*([^,]+)/);
  const ordered = m && !/\d/.test(m[2]) ? `${m[2]} ${m[1]}` : raw;
  return matchKey(ordered.replace(/\(?\b\d{3,4}\s*-\s*\d{0,4}\)?/g, " "));
}
