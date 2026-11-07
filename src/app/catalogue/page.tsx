import Link from "next/link";
import { Search, X } from "lucide-react";
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
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {t.catalogue.filters}
                  </h2>
                  <Link href="/catalogue">
                    <Button variant="ghost" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      {t.catalogue.reset}
                    </Button>
                  </Link>
                </div>

                {/* Search */}
                <div className="mb-6">
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
                    {category && (
                      <input type="hidden" name="category" value={category} />
                    )}
                    {language && (
                      <input type="hidden" name="language" value={language} />
                    )}
                    {sort !== "popular" && (
                      <input type="hidden" name="sort" value={sort} />
                    )}
                  </form>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.catalogue.category}
                  </label>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/catalogue?${buildQuery(current, {
                          category:
                            category === cat.slug ? undefined : cat.slug,
                          page: undefined,
                        })}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          category === cat.slug
                            ? "bg-slate-800 text-white dark:bg-amber-500"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs opacity-70">{cat.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.catalogue.language}
                  </label>
                  <div className="space-y-2">
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
                        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                          language === lang.code
                            ? "bg-slate-800 text-white dark:bg-amber-500"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {lang.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t.catalogue.sortBy}
                  </label>
                  <SortSelect value={sort} />
                </div>
              </div>
            </aside>

            {/* Books Grid */}
            <div className="flex-1">
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {total} {foundWord}
                  {query && (
                    <>
                      {" "}
                      {t.catalogue.forQuery} «&nbsp;<strong>{query}</strong>&nbsp;»
                    </>
                  )}
                </p>
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
