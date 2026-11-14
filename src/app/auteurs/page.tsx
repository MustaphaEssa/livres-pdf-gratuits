import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { i18nAlternates } from "@/i18n/seo";
import { plural } from "@/i18n/format";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import Icon, { I } from "@/components/design/icon";
import { getAuthorsWithCounts, getCategoriesWithCounts } from "@/lib/books";

export async function generateMetadata() {
  const { locale, t } = await getServerI18n();
  return {
    title: t.meta.authorsTitle,
    description: t.meta.authorsDesc,
    alternates: i18nAlternates(locale, "/auteurs"),
  };
}

export default async function AuthorsPage() {
  const { locale, t } = await getServerI18n();
  const [authors, categories] = await Promise.all([
    getAuthorsWithCounts(),
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
            <span aria-current="page">{t.nav.authors}</span>
          </nav>
          <div className="page-head">
            <div>
              <h1>{t.authors.title}</h1>
              <p>{plural(locale, t.authors.count, authors.length)}</p>
            </div>
          </div>

          {authors.length === 0 ? (
            <div className="empty">
              <h3>{t.authors.empty}</h3>
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
                      {plural(locale, t.common.books, a.count)}
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
