/**
 * Fiches « à faible valeur » pour Google : noindex (la page reste accessible) et
 * absence du sitemap. Un seul cas, volontairement étroit : les documents qui ne sont pas
 * des livres (numéros de revues, bulletins, catalogues, registres de copyright, rapports
 * annuels, actes de procès, magazines…). Les œuvres qui « ressemblent » (« traduction
 * revue », « Œuvres complètes revues sur… », « Mitteilungen aus den Memoiren des Satan »,
 * « Märchen-Almanach ») ne sont PAS visées.
 *
 * Pas de règle « popularité nulle » : contrôlée, elle visait de vraies œuvres (Schiller,
 * Rosegger…) dont la mesure externe avait simplement échoué.
 *
 * Une fiche avec un résumé Wikipédia (œuvre connue) n'est jamais concernée.
 */

const NON_BOOK = [
  /^(revue|bulletin|annuaire|catalogue|katalog|catalog|tijdschrift|bollettino)\b/i,
  /\brevue d(e|'|ʼ|’)\s?l?/i,
  /\bmitteilungen band\b|\bband [ivxlc]+, heft\b|\bheft \d/i,
  /\bcatalog(ue)? of copyright entries\b|\bcopyright renewals\b/i,
  /\b(annual|sixth|fifth|fourth|third|second|first) annual report\b|\bannual report of\b/i,
  /\bmagazine, volume \d|\bvolume \d+, number \d+/i,
  /\bla vraie mode\b/i,
  /\bproceedings (of|in)\b/i,
  /\bsommaire du proc[eè]z\b/i,
  /\bjournal officiel\b/i,
  /\bcomptes? rendus? (des|de la|du)\b/i,
  /\bproc[eè]s-verbal\b/i,
];

export interface QualityFields {
  title: string;
  descriptionSource?: string | null;
  popularity?: number | null;
  popularityData?: unknown;
  downloadCount?: number | null;
}

export function isLowValueBook(b: QualityFields): boolean {
  if ((b.descriptionSource ?? "").startsWith("http")) return false;
  return NON_BOOK.some((re) => re.test(b.title));
}
