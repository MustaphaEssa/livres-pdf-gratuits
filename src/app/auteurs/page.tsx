import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { pageMetadata, MAX_INDEXED_PAGE } from "@/lib/seo";
import { fmt, plural } from "@/i18n/format";
import Pagination from "@/components/design/pagination";
import { localizePath } from "@/i18n/config";
import { redirect } from "next/navigation";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import Icon, { I } from "@/components/design/icon";
import { getAuthorsWithCounts, getCategoriesWithCounts } from "@/lib/books";

// 60 auteurs par page (avant : tous sur une seule page, ~900 Ko et 500+ photos)
const PER_PAGE = 60;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const pageFrom = (v?: string) => {
  const n = parseInt(v ?? "1", 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
};
const pageHref = (p: number) => (p > 1 ? `/auteurs?page=${p}` : "/auteurs");

export async function generateMetadata({ searchParams }: Props) {
  const [{ locale, t }, sp] = await Promise.all([getServerI18n(), searchParams]);
  const page = pageFrom(sp.page);
  return pageMetadata({
    locale,
    path: pageHref(page),
    title: page > 1 ? `${t.meta.authorsTitle} — ${fmt(t.common.page, { n: page })}` : t.meta.authorsTitle,
    description: t.meta.authorsDesc,
    noindex: page > MAX_INDEXED_PAGE,
  });
}

export default async function AuthorsPage({ searchParams }: Props) {
  const { locale, t } = await getServerI18n();
  const [allAuthors, categories, sp] = await Promise.all([
    getAuthorsWithCounts(),
    getCategoriesWithCounts(),
    searchParams,
  ]);
  const totalPages = Math.max(1, Math.ceil(allAuthors.length / PER_PAGE));
  if (pageFrom(sp.page) > totalPages) redirect(localizePath(locale, pageHref(totalPages)));
  const page = pageFrom(sp.page);
  const authors = allAuthors.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
              <p>{plural(locale, t.authors.count, allAuthors.length)}</p>
            </div>
          </div>

          {allAuthors.length === 0 ? (
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
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
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
          <Pagination current={page} total={totalPages} makeHref={pageHref} />
        </div>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
