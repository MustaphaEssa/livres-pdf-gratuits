import Link from "next/link";
import { notFound } from "next/navigation";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCard from "@/components/design/book-card";
import Icon, { I } from "@/components/design/icon";
import { getPublishedCollectionBySlug } from "@/lib/collections";
import { getCategoriesWithCounts } from "@/lib/books";
import { SITE_URL } from "@/lib/site";
import JsonLd, { breadcrumbLd, itemListLd } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const col = await getPublishedCollectionBySlug(slug);
  if (!col) return { title: "Collection introuvable" };
  return {
    title: col.title,
    description: col.description || `Une sélection de ${col.books.length} livres gratuits.`,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: col.title,
      description: col.description || undefined,
      type: "website",
      url: `${SITE_URL}/collections/${slug}`,
      ...(col.coverImage ? { images: [{ url: col.coverImage }] } : {}),
    },
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const [col, categories] = await Promise.all([
    getPublishedCollectionBySlug(slug),
    getCategoriesWithCounts(),
  ]);
  if (!col) notFound();

  return (
    <div className="ma">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", url: "/" },
            { name: "Collections", url: "/collections" },
            { name: col.title, url: `/collections/${slug}` },
          ]),
          itemListLd(
            col.books.map((e) => e.book),
            col.title
          ),
        ]}
      />
      <DesignHeader />
      <main className="page-main">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Fil d'Ariane" style={{ paddingTop: 16 }}>
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link href="/collections">Collections</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{col.title}</span>
          </nav>
          <div className="page-head">
            <div>
              <div className="eyebrow">
                <Icon d={I.library} size={16} /> Collection
              </div>
              <h1>{col.title}</h1>
              {col.description && <p>{col.description}</p>}
              <p style={{ color: "var(--muted)", marginTop: 6 }}>
                {col.books.length} livre{col.books.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {col.books.map((entry) => (
              <div
                key={entry.bookId}
                style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 24, alignItems: "start" }}
              >
                <BookCard book={entry.book} />
                {entry.note && (
                  <p
                    className="prose"
                    style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 18, fontSize: 17 }}
                  >
                    {entry.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
