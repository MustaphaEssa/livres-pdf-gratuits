"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BookCard, { type CardBook } from "./book-card";
import BookCover from "./book-cover";
import Icon, { I } from "./icon";
import { formatAuthorName } from "@/lib/utils";
import { languageLabel, sortLanguages } from "@/lib/languages";

export interface CatBook extends CardBook {
  mediaType?: string | null;
  audioSourceId?: string | null;
}

const PAGE = 24;
type Sort = "relevance" | "az" | "author";

const hasAudio = (b: CatBook) => b.mediaType === "AUDIO" || !!b.audioSourceId || !!b.audioTracks;
const catNames = (b: CatBook) => (b.categories ?? []).map((c) => c.category.name);

export default function CatalogueClient({
  books,
  categories,
  initial,
}: {
  books: CatBook[];
  categories: string[];
  initial: { q: string; cats: string[]; langs: string[]; audio: boolean };
}) {
  const [q, setQ] = useState(initial.q);
  const [cats, setCats] = useState<string[]>(initial.cats);
  const [langs, setLangs] = useState<string[]>(initial.langs);
  const [audio, setAudio] = useState(initial.audio);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<Sort>("relevance");
  const [shown, setShown] = useState(PAGE);

  // Langues présentes dans le catalogue (toutes, pas seulement FR/EN/AR)
  const langsAvailable = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of books) if (b.language) counts.set(b.language, (counts.get(b.language) ?? 0) + 1);
    return sortLanguages([...counts].map(([code, count]) => ({ code, count }))).map((l) => l.code);
  }, [books]);
  const count = (f: (b: CatBook) => boolean) => books.filter(f).length;

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = books.filter((b) => {
      const names = catNames(b);
      return (
        (!needle ||
          b.title.toLowerCase().includes(needle) ||
          b.author.toLowerCase().includes(needle) ||
          names.some((n) => n.toLowerCase().includes(needle))) &&
        (!cats.length || names.some((n) => cats.includes(n))) &&
        (!langs.length || (b.language != null && langs.includes(b.language))) &&
        (!audio || hasAudio(b))
      );
    });
    if (sort === "az") r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "author") r = [...r].sort((a, b) => a.author.localeCompare(b.author));
    return r;
  }, [books, q, cats, langs, audio, sort]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const reset = () => {
    setQ("");
    setCats([]);
    setLangs([]);
    setAudio(false);
    setShown(PAGE);
  };
  const hasFilters = !!(q || cats.length || langs.length || audio);

  return (
    <div className="wrap">
      <nav className="breadcrumb" aria-label="Fil d'Ariane">
        <Link href="/">Accueil</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Catalogue</span>
      </nav>
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1>Catalogue</h1>
            <p>Parcourez la bibliothèque et ouvrez la fiche d&apos;un livre pour le lire ou le télécharger.</p>
          </div>
          <form className="search-compact" role="search" onSubmit={(e) => e.preventDefault()}>
            <Icon d={I.search} />
            <label className="sr-only" htmlFor="cat-q">Rechercher dans le catalogue</label>
            <input
              id="cat-q"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShown(PAGE);
              }}
              placeholder="Titre, auteur, genre…"
            />
          </form>
        </div>
        <div className="chips-scroll" role="group" aria-label="Genres">
          <button type="button" className="chip" aria-pressed={!cats.length} onClick={() => setCats([])}>
            Tous
          </button>
          {categories.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cats.includes(c)} onClick={() => toggle(cats, c, setCats)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="catalogue-layout">
        <aside className="filters" aria-label="Filtres">
          {langsAvailable.length > 0 && (
            <fieldset>
              <legend>Langue</legend>
              {langsAvailable.map((l) => (
                <label key={l} className="check">
                  <span>
                    <input type="checkbox" checked={langs.includes(l)} onChange={() => toggle(langs, l, setLangs)} />
                    {languageLabel(l)}
                  </span>
                  <small>{count((b) => b.language === l)}</small>
                </label>
              ))}
            </fieldset>
          )}
          <fieldset>
            <legend>Genre</legend>
            {categories.map((c) => (
              <label key={c} className="check">
                <span>
                  <input type="checkbox" checked={cats.includes(c)} onChange={() => toggle(cats, c, setCats)} />
                  {c}
                </span>
                <small>{count((b) => catNames(b).includes(c))}</small>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Format</legend>
            <label className="check">
              <span>
                <input type="checkbox" checked={audio} onChange={() => setAudio(!audio)} />
                Avec version audio
              </span>
              <small>{count(hasAudio)}</small>
            </label>
          </fieldset>
        </aside>

        <div className="results">
          <div className="results-bar">
            <strong aria-live="polite">
              {results.length} livre{results.length > 1 ? "s" : ""}
            </strong>
            <div className="results-tools">
              <label className="sr-only" htmlFor="sort">Trier par</label>
              <select id="sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="relevance">Pertinence</option>
                <option value="az">Titre A–Z</option>
                <option value="author">Auteur A–Z</option>
              </select>
              <div className="view-toggle" role="group" aria-label="Affichage">
                <button type="button" aria-pressed={view === "grid"} aria-label="Grille" onClick={() => setView("grid")}>
                  <Icon d={I.grid} />
                </button>
                <button type="button" aria-pressed={view === "list"} aria-label="Liste" onClick={() => setView("list")}>
                  <Icon d={I.list} />
                </button>
              </div>
            </div>
          </div>

          {hasFilters && (
            <div className="active-filters">
              {q && (
                <button type="button" className="chip" onClick={() => setQ("")}>
                  « {q} » <Icon d={I.close} size={14} />
                </button>
              )}
              {cats.map((c) => (
                <button key={c} type="button" className="chip" onClick={() => toggle(cats, c, setCats)}>
                  {c} <Icon d={I.close} size={14} />
                </button>
              ))}
              {langs.map((l) => (
                <button key={l} type="button" className="chip" onClick={() => toggle(langs, l, setLangs)}>
                  {languageLabel(l)} <Icon d={I.close} size={14} />
                </button>
              ))}
              {audio && (
                <button type="button" className="chip" onClick={() => setAudio(false)}>
                  Audio <Icon d={I.close} size={14} />
                </button>
              )}
              <button type="button" className="link-btn" onClick={reset}>
                Tout effacer
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty">
              <h3>Aucun livre trouvé</h3>
              <p>Essayez un autre mot-clé ou retirez un filtre.</p>
              <button type="button" className="btn btn-primary" onClick={reset}>
                Réinitialiser
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid-books">
              {results.slice(0, shown).map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
            </div>
          ) : (
            <div className="list-books">
              {results.slice(0, shown).map((b) => (
                <Link key={b.slug} href={`/livre/${b.slug}`} className="list-row">
                  <BookCover book={b} mini />
                  <span className="list-row-text">
                    <span className="list-row-title" dir="auto">
                      {b.title}
                    </span>
                    <span className="book-author" dir="auto">
                      {formatAuthorName(b.author)}
                    </span>
                  </span>
                  {hasAudio(b) && <span className="pill-audio">Audio</span>}
                  {catNames(b)[0] && <span className="cat">{catNames(b)[0]}</span>}
                  <Icon d={I.arrow} />
                </Link>
              ))}
            </div>
          )}

          {results.length > shown && (
            <div className="load-more">
              <button type="button" className="btn btn-outline" onClick={() => setShown(shown + PAGE)}>
                Afficher plus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
