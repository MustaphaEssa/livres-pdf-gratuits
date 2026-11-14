"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link, { useLocaleRouter, useLocalizedHref } from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import { categoryLabel, plural, formatNumber } from "@/i18n/format";
import BookCard, { type CardBook } from "./book-card";
import BookCover from "./book-cover";
import Icon, { I } from "./icon";
import { formatAuthorName } from "@/lib/utils";
import { languageLabel, sortLanguages } from "@/lib/languages";
import { catalogueHref, type CatalogueState, type CatSort } from "./catalogue-url";

export { catalogueHref, type CatalogueState, type CatSort };

const hasAudio = (b: CatBook) => b.mediaType === "AUDIO" || !!b.audioSourceId || !!b.audioTracks;

export interface CatBook extends CardBook {
  mediaType?: string | null;
  audioSourceId?: string | null;
}

/**
 * Catalogue : la recherche, les filtres et la pagination sont faits côté serveur
 * (une page de 24 livres). Chaque changement de filtre navigue vers l'URL
 * correspondante ; sans JavaScript, le formulaire et les liens fonctionnent aussi.
 */
export default function CatalogueClient({
  books,
  total,
  state,
  facets,
  pager,
}: {
  books: CatBook[];
  total: number;
  state: CatalogueState;
  facets: {
    categories: { name: string; slug: string; count: number }[];
    languages: { code: string; count: number }[];
    audioCount: number;
  };
  pager: ReactNode;
}) {
  const { t, locale } = useI18n();
  const router = useLocaleRouter();
  const localHref = useLocalizedHref();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(state.q);
  const [view, setView] = useState<"grid" | "list">("grid");

  const go = (next: Partial<CatalogueState>) =>
    startTransition(() => router.push(catalogueHref({ ...state, ...next }), { scroll: false }));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const reset = () => {
    setQ("");
    go({ q: "", cats: [], langs: [], audio: false });
  };
  const hasFilters = !!(state.q || state.cats.length || state.langs.length || state.audio);
  const catBySlug = new Map(facets.categories.map((c) => [c.slug, c]));
  const catLabelOf = (slug: string) => {
    const c = catBySlug.get(slug);
    return c ? categoryLabel(t, c) : slug;
  };
  const langs = sortLanguages(facets.languages);

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
          <form
            className="search-compact"
            role="search"
            action={localHref("/catalogue")}
            onSubmit={(e) => {
              e.preventDefault();
              go({ q });
            }}
          >
            <Icon d={I.search} />
            <label className="sr-only" htmlFor="cat-q">{t.catalogue.searchLabel}</label>
            <input
              id="cat-q"
              name="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search.placeholder}
            />
          </form>
        </div>
        <div className="chips-scroll" role="group" aria-label={t.catalogue.genres}>
          <Link className="chip" aria-current={!state.cats.length ? "true" : undefined} href={catalogueHref({ ...state, cats: [] })} scroll={false}>
            {t.common.all}
          </Link>
          {facets.categories.map((c) => (
            <Link
              key={c.slug}
              className="chip"
              aria-current={state.cats.includes(c.slug) ? "true" : undefined}
              href={catalogueHref({ ...state, cats: toggle(state.cats, c.slug) })}
              scroll={false}
            >
              {categoryLabel(t, c)}
            </Link>
          ))}
        </div>
      </div>

      <div className="catalogue-layout">
        <aside className="filters" aria-label={t.catalogue.filters}>
          {langs.length > 0 && (
            <fieldset>
              <legend>{t.catalogue.language}</legend>
              {langs.map((l) => (
                <label key={l.code} className="check">
                  <span>
                    <input
                      type="checkbox"
                      checked={state.langs.includes(l.code)}
                      onChange={() => go({ langs: toggle(state.langs, l.code) })}
                    />
                    {languageLabel(l.code)}
                  </span>
                  <small>{formatNumber(locale, l.count)}</small>
                </label>
              ))}
            </fieldset>
          )}
          <fieldset>
            <legend>{t.catalogue.genre}</legend>
            {facets.categories.map((c) => (
              <label key={c.slug} className="check">
                <span>
                  <input
                    type="checkbox"
                    checked={state.cats.includes(c.slug)}
                    onChange={() => go({ cats: toggle(state.cats, c.slug) })}
                  />
                  {categoryLabel(t, c)}
                </span>
                <small>{formatNumber(locale, c.count)}</small>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>{t.catalogue.format}</legend>
            <label className="check">
              <span>
                <input type="checkbox" checked={state.audio} onChange={() => go({ audio: !state.audio })} />
                {t.catalogue.withAudio}
              </span>
              <small>{formatNumber(locale, facets.audioCount)}</small>
            </label>
          </fieldset>
        </aside>

        <div className="results" aria-busy={pending} style={{ opacity: pending ? 0.6 : 1, transition: "opacity .15s" }}>
          <div className="results-bar">
            <strong aria-live="polite">{plural(locale, t.common.books, total)}</strong>
            <div className="results-tools">
              <label className="sr-only" htmlFor="sort">{t.catalogue.sortBy}</label>
              <select
                id="sort"
                className="select"
                value={state.sort}
                onChange={(e) => go({ sort: e.target.value as CatSort })}
              >
                <option value="relevance">{t.catalogue.sortRelevance}</option>
                <option value="newest">{t.home.newest}</option>
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
              {state.q && (
                <button type="button" className="chip" onClick={() => { setQ(""); go({ q: "" }); }}>
                  « {state.q} » <Icon d={I.close} size={14} />
                </button>
              )}
              {state.cats.map((c) => (
                <button key={c} type="button" className="chip" onClick={() => go({ cats: toggle(state.cats, c) })}>
                  {catLabelOf(c)} <Icon d={I.close} size={14} />
                </button>
              ))}
              {state.langs.map((l) => (
                <button key={l} type="button" className="chip" onClick={() => go({ langs: toggle(state.langs, l) })}>
                  {languageLabel(l)} <Icon d={I.close} size={14} />
                </button>
              ))}
              {state.audio && (
                <button type="button" className="chip" onClick={() => go({ audio: false })}>
                  {t.common.audio} <Icon d={I.close} size={14} />
                </button>
              )}
              <button type="button" className="link-btn" onClick={reset}>
                {t.common.clearAll}
              </button>
            </div>
          )}

          {books.length === 0 ? (
            <div className="empty">
              <h3>{t.catalogue.noResults}</h3>
              <p>{t.catalogue.noResultsHint}</p>
              <button type="button" className="btn btn-primary" onClick={reset}>
                {t.common.reset}
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid-books">
              {books.map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
            </div>
          ) : (
            <div className="list-books">
              {books.map((b) => {
                const c0 = b.categories?.[0]?.category;
                return (
                  <Link key={b.slug} href={`/livre/${b.slug}`} className="list-row">
                    <BookCover book={b} mini />
                    <span className="list-row-text">
                      <span className="list-row-title" dir="auto">{b.title}</span>
                      <span className="book-author" dir="auto">{formatAuthorName(b.author)}</span>
                    </span>
                    {hasAudio(b) && <span className="pill-audio">{t.common.audio}</span>}
                    {c0 && <span className="cat">{categoryLabel(t, c0)}</span>}
                    <Icon d={I.arrow} />
                  </Link>
                );
              })}
            </div>
          )}

          {pager}
        </div>
      </div>
    </div>
  );
}
