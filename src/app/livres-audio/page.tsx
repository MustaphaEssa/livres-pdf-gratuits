import Link from "next/link";
import { Headphones } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/books/book-card";
import { SortSelect } from "@/components/books/sort-select";
import { Pagination } from "@/components/books/pagination";
import { getAudiobooks, type SortOption } from "@/lib/books";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Livres audio gratuits",
  description:
    "Écoutez gratuitement des livres audio du domaine public (LibriVox) en streaming : romans, classiques, essais, lus par des bénévoles. Sans inscription.",
  alternates: { canonical: `/livres-audio` },
  openGraph: {
    title: "Livres audio gratuits",
    description:
      "Écoutez gratuitement des livres audio du domaine public en streaming, sans inscription.",
    type: "website",
    url: `${SITE_URL}/livres-audio`,
  },
};

const VALID_SORTS: SortOption[] = ["newest", "popular", "title-asc", "title-desc"];

interface Props {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function LivresAudioPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sort = (VALID_SORTS.includes(sp.sort as SortOption) ? sp.sort : "newest") as SortOption;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { books, total, totalPages } = await getAudiobooks(page, 24, sort);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (sort !== "newest") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/livres-audio${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          {/* En-tête */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-amber-500 font-medium mb-2">
              <Headphones className="h-5 w-5" /> Livres audio
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Livres audio gratuits
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Écoutez gratuitement des œuvres du domaine public, lues par des bénévoles
              (LibriVox), en streaming et sans inscription. {total > 0 && `${total} titre(s) disponible(s).`}
            </p>
          </div>

          {books.length > 0 ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white">{total}</strong> livre(s) audio
                </p>
                <div className="w-48">
                  <SortSelect value={sort} basePath="/livres-audio" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              <Pagination currentPage={page} totalPages={totalPages} makeHref={makeHref} />
            </>
          ) : (
            <div className="text-center py-16">
              <Headphones className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Aucun livre audio pour le moment. Revenez bientôt !
              </p>
              <Link href="/catalogue">
                <Button>Parcourir les livres PDF</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
