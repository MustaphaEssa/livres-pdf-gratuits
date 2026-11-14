"use client";

import { useMemo, useState } from "react";
import Link from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import { categoryLabel, plural } from "@/i18n/format";
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
  categories: { name: string; slug: string }[];
  initial: { q: string; cats: string[]; langs: string[]; audio: boolean };
}) {
  const { t, locale } = useI18n();
  const catLabel = (name: string) => {
    const c = categories.find((x) => x.name === name);
    return c ? categoryLabel(t, c) : name;
  };
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
      <nav className="breadcrumb" aria-label={t.common.breadcrumb}>
        <Link href="/">{t.nav.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.catalogue.title}</span>
      </nav>
      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1>{t.catalogue.title}</h1>
            <p>{t.catalogue.intro}</p>
          </div>
          <form className="search-compact" role="search" onSubmit={(e) => e.preventDefault()}>
            <Icon d={I.search} />
            <label className="sr-only" htmlFor="cat-q">{t.catalogue.searchLabel}</label>
            <input
              id="cat-q"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShown(PAGE);
              }}
              placeholder={t.search.placeholder}
            />
          </form>
        </div>
        <div className="chips-scroll" role="group" aria-label={t.catalogue.genres}>
          <button type="button" className="chip" aria-pressed={!cats.length} onClick={() => setCats([])}>
            {t.common.all}
          </button>
          {categories.map(({ name: c }) => (
            <button key={c} type="button" className="chip" aria-pressed={cats.includes(c)} onClick={() => toggle(cats, c, setCats)}>
              {catLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="catalogue-layout">
        <aside className="filters" aria-label={t.catalogue.filters}>
          {langsAvailable.length > 0 && (
            <fieldset>
              <legend>{t.catalogue.language}</legend>
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
            <legend>{t.catalogue.genre}</legend>
            {categories.map(({ name: c }) => (
              <label key={c} className="check">
                <span>
                  <input type="checkbox" checked={cats.includes(c)} onChange={() => toggle(cats, c, setCats)} />
                  {catLabel(c)}
                </span>
                <small>{count((b) => catNames(b).includes(c))}</small>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>{t.catalogue.format}</legend>
            <label className="check">
              <span>
                <input type="checkbox" checked={audio} onChange={() => setAudio(!audio)} />
                {t.catalogue.withAudio}
              </span>
              <small>{count(hasAudio)}</small>
            </label>
          </fieldset>
        </aside>

        <div className="results">
          <div className="results-bar">
            <strong aria-live="polite">
              {plural(locale, t.common.books, results.length)}
            </strong>
            <div className="results-tools">
              <label className="sr-only" htmlFor="sort">{t.catalogue.sortBy}</label>
              <select id="sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="relevance">{t.catalogue.sortRelevance}</option>
                <option value="az">{t.catalogue.sortTitle}</option>
                <option value="author">{t.catalogue.sortAuthor}</option>
              </select>
              <div className="view-toggle" role="group" aria-label={t.catalogue.view}>
                <button type="button" aria-pressed={view === "grid"} aria-label={t.catalogue.grid} onClick={() => setView("grid")}>
                  <Icon d={I.grid} />
                </button>
                <button type="button" aria-pressed={view === "list"} aria-label={t.catalogue.list} onClick={() => setView("list")}>
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
                  {catLabel(c)} <Icon d={I.close} size={14} />
                </button>
              ))}
              {langs.map((l) => (
                <button key={l} type="button" className="chip" onClick={() => toggle(langs, l, setLangs)}>
                  {languageLabel(l)} <Icon d={I.close} size={14} />
                </button>
              ))}
              {audio && (
                <button type="button" className="chip" onClick={() => setAudio(false)}>
                  {t.common.audio} <Icon d={I.close} size={14} />
                </button>
              )}
              <button type="button" className="link-btn" onClick={reset}>
                {t.common.clearAll}
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty">
              <h3>{t.catalogue.noResults}</h3>
              <p>{t.catalogue.noResultsHint}</p>
              <button type="button" className="btn btn-primary" onClick={reset}>
                {t.common.reset}
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
                  {hasAudio(b) && <span className="pill-audio">{t.common.audio}</span>}
                  {catNames(b)[0] && <span className="cat">{catLabel(catNames(b)[0])}</span>}
                  <Icon d={I.arrow} />
                </Link>
              ))}
            </div>
          )}

          {results.length > shown && (
            <div className="load-more">
              <button type="button" className="btn btn-outline" onClick={() => setShown(shown + PAGE)}>
                {t.common.showMore}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
