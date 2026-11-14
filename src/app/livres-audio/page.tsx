import Link from "next/link";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCard from "@/components/design/book-card";
import Icon, { I } from "@/components/design/icon";
import { getAudiobooks, getCategoriesWithCounts } from "@/lib/books";
import Pagination from "@/components/design/pagination";

const PAGE_SIZE = 24;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const pageFrom = (v: string | string[] | undefined) => {
  const n = parseInt(Array.isArray(v) ? v[0] : v ?? "1", 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
};
const pageHref = (p: number) => (p > 1 ? `/livres-audio?page=${p}` : "/livres-audio");

export async function generateMetadata({ searchParams }: Props) {
  const page = pageFrom((await searchParams).page);
  return {
    title: page > 1 ? `Livres audio gratuits — page ${page}` : "Livres audio gratuits",
    description:
      "Écoutez gratuitement des livres audio du domaine public (LibriVox) en streaming : romans, classiques, essais, lus par des bénévoles. Sans inscription.",
    alternates: { canonical: pageHref(page) },
  };
}

export default async function LivresAudioPage({ searchParams }: Props) {
  const requested = pageFrom((await searchParams).page);
  const [{ books, total, page, totalPages }, categories] = await Promise.all([
    getAudiobooks(requested, PAGE_SIZE, "newest"),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="ma">
      <DesignHeader />
      <main className="page-main" id="contenu">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Fil d'Ariane" style={{ paddingTop: 16 }}>
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Livres audio</span>
          </nav>
          <div className="page-head">
            <div className="page-head-row">
              <div>
                <div className="eyebrow">
                  <Icon d={I.headphones} size={16} /> Audio
                </div>
                <h1>Livres audio gratuits</h1>
                <p>
                  Écoutez gratuitement des œuvres du domaine public, lues par des bénévoles
                  (LibriVox), en streaming et sans inscription. Les livres marqués « PDF + audio »
                  se lisent aussi en PDF.
                  {total > 0 && ` ${total} titre${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}.`}
                </p>
              </div>
            </div>
          </div>

          {books.length > 0 ? (
            <>
              <div className="grid-books">
                {books.map((b) => (
                  <BookCard key={b.slug} book={b} />
                ))}
              </div>
              <Pagination current={page} total={totalPages} makeHref={pageHref} />
            </>
          ) : total > 0 ? (
            <div className="empty">
              <h3>Cette page n&apos;existe pas</h3>
              <p>
                Il y a {totalPages} page{totalPages > 1 ? "s" : ""} de livres audio.
              </p>
              <Link href="/livres-audio" className="btn btn-primary">
                Revenir à la première page
              </Link>
            </div>
          ) : (
            <div className="empty">
              <h3>Aucun livre audio pour le moment</h3>
              <p>Revenez bientôt, ou parcourez les livres à lire.</p>
              <Link href="/catalogue" className="btn btn-primary">
                Parcourir le catalogue
              </Link>
            </div>
          )}
        </div>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
