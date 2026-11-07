import Link from "next/link";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard } from "@/components/books/book-card";
import { SortSelect } from "@/components/books/sort-select";
import { Pagination } from "@/components/books/pagination";
import {
  searchBooks,
  getCategoriesWithCounts,
  type SortOption,
} from "@/lib/books";
import { getServerI18n } from "@/i18n/server";

interface CataloguePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    language?: string;
    sort?: string;
    page?: string;
  }>;
}

const VALID_SORTS: SortOption[] = [
  "popular",
  "newest",
  "title-asc",
  "title-desc",
];

// Construit une query string en conservant les paramètres existants
function buildQuery(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

export default async function CataloguePage({
  searchParams,
}: CataloguePageProps) {
  const sp = await searchParams;
  const query = sp.q ?? "";
  const category = sp.category ?? "";
  const language = sp.language ?? "";
  const sort = (VALID_SORTS.includes(sp.sort as SortOption)
    ? sp.sort
    : "popular") as SortOption;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ books, total, totalPages }, categories, { t }] = await Promise.all([
    searchBooks({ query, category, language, sort, page }),
    getCategoriesWithCounts(),
    getServerI18n(),
  ]);
  const foundWord = total !== 1 ? t.catalogue.foundPlural : t.catalogue.found;

  // Paramètres courants (hors page) pour reconstruire les liens
  const current = {
    q: query || undefined,
    category: category || undefined,
    language: language || undefined,
    sort: sort !== "popular" ? sort : undefined,
  };

  const langLabel = (code: string) =>
    code === "fr" ? "Français" : code === "en" ? "English" : t.catalogue.allLanguages;

  // Puces de filtres actifs (retirables d'un clic). La recherche et le tri
  // n'y figurent pas (la recherche a son champ ; le tri a toujours une valeur).
  const activeChips: { key: string; label: string; href: string }[] = [];
  if (query) {
    activeChips.push({
      key: "q",
      label: `« ${query} »`,
      href: `/catalogue?${buildQuery(current, { q: undefined, page: undefined })}`,
    });
  }
  if (category) {
    const cat = categories.find((c) => c.slug === category);
    activeChips.push({
      key: "category",
      label: cat?.name ?? category,
      href: `/catalogue?${buildQuery(current, { category: undefined, page: undefined })}`,
    });
  }
  if (language) {
    activeChips.push({
      key: "language",
      label: langLabel(language),
      href: `/catalogue?${buildQuery(current, { language: undefined, page: undefined })}`,
    });
  }
  const activeCount = activeChips.length;

  // Contenu du panneau de filtres (réutilisé pour le mobile et le bureau)
  const filtersContent = (
    <div className="space-y-6">
      {/* Recherche */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.catalogue.searchLabel}
        </label>
        <form action="/catalogue" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              name="q"
              defaultValue={query}
              placeholder={t.search.placeholder}
              className="pl-9"
            />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          {language && <input type="hidden" name="language" value={language} />}
          {sort !== "popular" && <input type="hidden" name="sort" value={sort} />}
        </form>
      </div>

      {/* Catégories */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.catalogue.category}
        </label>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1 -mr-1">
          <Link
            href={`/catalogue?${buildQuery(current, { category: undefined, page: undefined })}`}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              !category
                ? "bg-amber-500 text-white font-medium"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <span>{t.catalogue.allLanguages}</span>
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalogue?${buildQuery(current, {
                category: category === cat.slug ? undefined : cat.slug,
                page: undefined,
              })}`}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                category === cat.slug
                  ? "bg-amber-500 text-white font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  category === cat.slug
                    ? "bg-white/20"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
                }`}
              >
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Langue */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.catalogue.language}
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { code: "", label: t.catalogue.allLanguages },
            { code: "fr", label: "Français" },
            { code: "en", label: "English" },
          ].map((lang) => (
            <Link
              key={lang.code || "all"}
              href={`/catalogue?${buildQuery(current, {
                language: lang.code || undefined,
                page: undefined,
              })}`}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                language === lang.code
                  ? "border-amber-500 bg-amber-500 text-white font-medium"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              }`}
            >
              {lang.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tri */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t.catalogue.sortBy}
        </label>
        <SortSelect value={sort} />
      </div>

      {/* Réinitialiser (seulement si au moins un filtre actif) */}
      {activeCount > 0 && (
        <Link
          href="/catalogue"
          className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <X className="h-4 w-4" />
          {t.catalogue.reset}
        </Link>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t.catalogue.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t.catalogue.collectionOf} {total} {t.catalogue.booksWord}{" "}
              {t.catalogue.freePdf}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filtres — repliable sur mobile (<details>, sans JS) */}
            <details className="group lg:hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-amber-500" />
                  {t.catalogue.filters}
                  {activeCount > 0 && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                      {activeCount}
                    </span>
                  )}
                </span>
                <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-5">
                {filtersContent}
              </div>
            </details>

            {/* Filtres — barre latérale sur bureau */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
                <h2 className="mb-5 font-semibold text-slate-900 dark:text-white">
                  {t.catalogue.filters}
                </h2>
                {filtersContent}
              </div>
            </aside>

            {/* Books Grid */}
            <div className="flex-1">
              {/* Résultats + puces de filtres actifs */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white">{total}</strong>{" "}
                  {foundWord}
                </p>
                {activeChips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {activeChips.map((chip) => (
                      <Link
                        key={chip.key}
                        href={chip.href}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-800 transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      >
                        <span className="truncate max-w-[12rem]">{chip.label}</span>
                        <X className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                      </Link>
                    ))}
                    <Link
                      href="/catalogue"
                      className="text-sm text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
                    >
                      {t.catalogue.reset}
                    </Link>
                  </div>
                )}
              </div>

              {books.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    {t.catalogue.noResults}
                  </p>
                  <Link href="/catalogue">
                    <Button>{t.catalogue.seeAllBooks}</Button>
                  </Link>
                </div>
              )}

              {/* Pagination tronquée */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                makeHref={(p) =>
                  `/catalogue?${buildQuery(current, {
                    page: p === 1 ? undefined : String(p),
                  })}`
                }
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
