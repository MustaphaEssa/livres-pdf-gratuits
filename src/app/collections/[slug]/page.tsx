import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { i18nAlternates } from "@/i18n/seo";
import { localizePath } from "@/i18n/config";
import { fmt, plural } from "@/i18n/format";
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
  const [col, { locale, t }] = await Promise.all([getPublishedCollectionBySlug(slug), getServerI18n()]);
  if (!col) return { title: t.meta.collectionNotFound };
  return {
    title: col.title,
    description: col.description || fmt(t.meta.collectionDesc, { n: col.books.length }),
    alternates: i18nAlternates(locale, `/collections/${slug}`),
    openGraph: {
      title: col.title,
      description: col.description || undefined,
      type: "website",
      url: `${SITE_URL}${localizePath(locale, `/collections/${slug}`)}`,
      ...(col.coverImage ? { images: [{ url: col.coverImage }] } : {}),
    },
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const { locale, t } = await getServerI18n();
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
            { name: t.nav.home, url: "/" },
            { name: t.nav.collections, url: "/collections" },
            { name: col.title, url: `/collections/${slug}` },
          ], locale),
          itemListLd(
            col.books.map((e) => e.book),
            col.title,
            locale
          ),
        ]}
      />
      <DesignHeader />
      <main className="page-main" id="contenu">
        <div className="wrap">
          <nav className="breadcrumb" aria-label={t.common.breadcrumb} style={{ paddingTop: 16 }}>
            <Link href="/">{t.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/collections">{t.nav.collections}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{col.title}</span>
          </nav>
          <div className="page-head">
            <div>
              <div className="eyebrow">
                <Icon d={I.library} size={16} /> {t.collections.one}
              </div>
              <h1>{col.title}</h1>
              {col.description && <p>{col.description}</p>}
              <p style={{ color: "var(--muted)", marginTop: 6 }}>
                {plural(locale, t.common.books, col.books.length)}
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
                    style={{ borderInlineStart: "3px solid var(--accent)", paddingInlineStart: 18, fontSize: 17 }}
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
