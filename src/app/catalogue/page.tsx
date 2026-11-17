import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import Pagination from "@/components/design/pagination";
import CatalogueClient, { type CatBook } from "@/components/design/catalogue-client";
import { catalogueHref, type CatalogueState, type CatSort } from "@/components/design/catalogue-url";
import { searchCatalogue, getCatalogueFacets } from "@/lib/books";
import JsonLd, { breadcrumbLd, itemListLd } from "@/components/seo/json-ld";
import { isLangCode } from "@/lib/languages";
import { getServerI18n } from "@/i18n/server";
import { pageMetadata, MAX_INDEXED_PAGE } from "@/lib/seo";
import { fmt } from "@/i18n/format";
import { localizePath } from "@/i18n/config";
import { redirect } from "next/navigation";
import { cache } from "react";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const one = (v: string | string[] | undefined) => all(v)[0] ?? "";
const SORTS: CatSort[] = ["relevance", "az", "author", "newest"];

function parseState(sp: Record<string, string | string[] | undefined>): CatalogueState & { page: number } {
  const sort = one(sp.sort) as CatSort;
  const page = parseInt(one(sp.page), 10);
  return {
    q: one(sp.q).slice(0, 100),
    // « cat » / « lang » : anciens noms de paramètres, toujours acceptés
    cats: [...all(sp.category), ...all(sp.cat)].filter((s) => /^[a-z0-9-]{1,60}$/.test(s)),
    langs: [...all(sp.language), ...all(sp.lang)].filter(isLangCode),
    audio: one(sp.audio) === "1",
    sort: SORTS.includes(sort) ? sort : "relevance",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

// Même recherche pour les métadonnées et la page : une seule requête par rendu.
const runSearch = cache((key: string) => {
  const s = JSON.parse(key) as CatalogueState & { page: number };
  return searchCatalogue({ q: s.q, categories: s.cats, languages: s.langs, audio: s.audio, sort: s.sort, page: s.page });
});

export async function generateMetadata({ searchParams }: Props) {
  const [{ locale, t }, state] = await Promise.all([getServerI18n(), searchParams.then(parseState)]);
  // Page au-delà de la dernière (?page=9999) → vraie redirection 307 vers la dernière page
  // (faite ici car les métadonnées sont résolues avant l'envoi de la page).
  const { totalPages } = await runSearch(JSON.stringify(state));
  if (state.page > totalPages) redirect(localizePath(locale, catalogueHref(state, totalPages)));
  const filtered = !!(state.q || state.cats.length || state.langs.length || state.audio || state.sort !== "relevance");
  // Pages paginées : indexables (chacune liste d'autres livres). Recherches et
  // filtres : combinaisons infinies → noindex, mais liens suivis.
  const path = state.page > 1 ? `/catalogue?page=${state.page}` : "/catalogue";
  return pageMetadata({
    locale,
    path: filtered ? "/catalogue" : path,
    title: state.page > 1 ? `${t.meta.catalogueTitle} — ${fmt(t.common.page, { n: state.page })}` : t.meta.catalogueTitle,
    description: t.meta.catalogueDesc,
    noindex: filtered || state.page > MAX_INDEXED_PAGE,
  });
}

export default async function CataloguePage({ searchParams }: Props) {
  const state = parseState(await searchParams);
  const [{ locale, t }, result, facets] = await Promise.all([
    getServerI18n(),
    runSearch(JSON.stringify(state)),
    getCatalogueFacets(),
  ]);
  if (state.page > result.totalPages) redirect(localizePath(locale, catalogueHref(state, result.totalPages)));

  return (
    <div className="ma">
      <JsonLd
        data={[
          breadcrumbLd(
            [
              { name: t.nav.home, url: "/" },
              { name: t.nav.catalogue, url: "/catalogue" },
            ],
            locale
          ),
          ...(result.books.length ? [itemListLd(result.books, t.meta.catalogueTitle, locale)] : []),
        ]}
      />
      <DesignHeader />
      <main className="page-main" id="contenu">
        <CatalogueClient
          books={result.books as CatBook[]}
          total={result.total}
          state={state}
          facets={facets}
          pager={
            <Pagination
              current={result.page}
              total={result.totalPages}
              makeHref={(p) => catalogueHref(state, p)}
            />
          }
        />
      </main>
      <DesignFooter categories={facets.categories} />
      <MobileTabbar />
    </div>
  );
}
