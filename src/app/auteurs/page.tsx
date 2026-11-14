import Link from "next/link";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import Icon, { I } from "@/components/design/icon";
import { getAuthorsWithCounts, getCategoriesWithCounts } from "@/lib/books";

export const metadata = {
  title: "Auteurs",
  description: "Parcourez les auteurs du domaine public et découvrez tous leurs livres gratuits.",
  alternates: { canonical: "/auteurs" },
};

export default async function AuthorsPage() {
  const [authors, categories] = await Promise.all([
    getAuthorsWithCounts(),
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
            <span aria-current="page">Auteurs</span>
          </nav>
          <div className="page-head">
            <div>
              <h1>Auteurs</h1>
              <p>
                {authors.length} auteur{authors.length > 1 ? "s" : ""} dans la bibliothèque.
              </p>
            </div>
          </div>

          {authors.length === 0 ? (
            <div className="empty">
              <h3>Aucun auteur pour le moment</h3>
            </div>
          ) : (
            <div className="mini-grid">
              {authors.map((a) => (
                <Link key={a.slug} href={`/auteur/${a.slug}`} className="mini-row">
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.image}
                      alt={a.name}
                      style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flex: "none" }}
                    />
                  ) : (
                    <span
                      className="avatar"
                      aria-hidden="true"
                      style={{ width: 48, height: 48, fontSize: 20, flex: "none" }}
                    >
                      {[...a.name][0]}
                    </span>
                  )}
                  <span className="list-row-text" style={{ minWidth: 0 }}>
                    <span className="t" dir="auto">
                      {a.name}
                    </span>
                    <span className="book-author">
                      {a.count} livre{a.count > 1 ? "s" : ""}
                    </span>
                  </span>
                  <Icon d={I.arrow} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
