import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { plural } from "@/i18n/format";
import { localizeCollection } from "@/i18n/collections";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import Icon, { I } from "@/components/design/icon";
import { getPublishedCollections } from "@/lib/collections";
import { getCategoriesWithCounts } from "@/lib/books";

export async function generateMetadata() {
  const { locale, t } = await getServerI18n();
  return pageMetadata({
    locale,
    path: "/collections",
    title: t.meta.collectionsTitle,
    description: t.meta.collectionsDesc,
  });
}

export default async function CollectionsPage() {
  const { locale, t } = await getServerI18n();
  const [collections, categories] = await Promise.all([
    getPublishedCollections().then((cs) => cs.map((c) => localizeCollection(locale, c))),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="ma">
      <DesignHeader />
      <main className="page-main" id="contenu">
        <div className="wrap">
          <nav className="breadcrumb" aria-label={t.common.breadcrumb} style={{ paddingTop: 16 }}>
            <Link href="/">{t.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t.nav.collections}</span>
          </nav>
          <div className="page-head">
            <div>
              <div className="eyebrow">
                <Icon d={I.library} size={16} /> {t.collections.eyebrow}
              </div>
              <h1>{t.collections.title}</h1>
              <p>{t.collections.intro}</p>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="empty">
              <h3>{t.collections.empty}</h3>
              <p>{t.collections.emptyHint}</p>
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
                  <span className="book-cat">{plural(locale, t.common.books, c._count.books)}</span>
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
