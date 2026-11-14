import Link from "next/link";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import Icon, { I } from "@/components/design/icon";
import { getPublishedCollections } from "@/lib/collections";
import { getCategoriesWithCounts } from "@/lib/books";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Collections de livres",
  description:
    "Des sélections thématiques de livres gratuits : classiques à lire en un week-end, romans d'aventure, et plus. Choisies pour vous.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const [collections, categories] = await Promise.all([
    getPublishedCollections(),
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
            <span aria-current="page">Collections</span>
          </nav>
          <div className="page-head">
            <div>
              <div className="eyebrow">
                <Icon d={I.library} size={16} /> Collections
              </div>
              <h1>Collections de livres</h1>
              <p>Des sélections thématiques, réunies autour d&apos;une idée, pour trouver votre prochaine lecture.</p>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="empty">
              <h3>Aucune collection pour le moment</h3>
              <p>Revenez bientôt pour découvrir nos sélections.</p>
            </div>
          ) : (
            <div className="genre-grid">
              {collections.map((c) => (
                <Link key={c.id} href={`/collections/${c.slug}`} className="format-card" style={{ textDecoration: "none" }}>
                  {c.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.coverImage}
                      alt={c.title}
                      style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12 }}
                    />
                  ) : (
                    <span className="genre-icon">
                      <Icon d={I.library} size={24} />
                    </span>
                  )}
                  <h2 style={{ fontSize: 22 }}>{c.title}</h2>
                  {c.description && <p>{c.description}</p>}
                  <span className="book-cat">{c._count.books} livre{c._count.books > 1 ? "s" : ""}</span>
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
