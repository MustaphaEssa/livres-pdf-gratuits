import Link from "next/link";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCard from "@/components/design/book-card";
import Icon, { I } from "@/components/design/icon";
import { getAudiobooks, getCategoriesWithCounts } from "@/lib/books";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Livres audio gratuits",
  description:
    "Écoutez gratuitement des livres audio du domaine public (LibriVox) en streaming : romans, classiques, essais, lus par des bénévoles. Sans inscription.",
  alternates: { canonical: "/livres-audio" },
};

export default async function LivresAudioPage() {
  const [{ books, total }, categories] = await Promise.all([
    getAudiobooks(1, 60, "newest"),
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
            <div className="grid-books">
              {books.map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
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
