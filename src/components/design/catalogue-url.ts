// État des filtres du catalogue <-> URL (partagé serveur / client).

export type CatSort = "relevance" | "az" | "author" | "newest";

export interface CatalogueState {
  q: string;
  cats: string[]; // slugs
  langs: string[];
  audio: boolean;
  sort: CatSort;
}


/** Construit l'URL du catalogue pour un état de filtres (page 1 sauf mention). */
export function catalogueHref(s: CatalogueState, page = 1): string {
  const p = new URLSearchParams();
  if (s.q.trim()) p.set("q", s.q.trim());
  for (const c of s.cats) p.append("category", c);
  for (const l of s.langs) p.append("language", l);
  if (s.audio) p.set("audio", "1");
  if (s.sort !== "relevance") p.set("sort", s.sort);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/catalogue?${qs}` : "/catalogue";
}
