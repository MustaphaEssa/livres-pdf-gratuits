import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { i18nAlternates } from "@/i18n/seo";
import { fmt, plural } from "@/i18n/format";
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
  const { locale, t } = await getServerI18n();
  return {
    title: page > 1 ? fmt(t.meta.audioTitlePage, { n: page }) : t.meta.audioTitle,
    description: t.meta.audioDesc,
    alternates: i18nAlternates(locale, pageHref(page)),
  };
}

export default async function LivresAudioPage({ searchParams }: Props) {
  const requested = pageFrom((await searchParams).page);
  const { locale, t } = await getServerI18n();
  const [{ books, total, page, totalPages }, categories] = await Promise.all([
    getAudiobooks(requested, PAGE_SIZE, "newest"),
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
            <span aria-current="page">{t.nav.audiobooks}</span>
          </nav>
          <div className="page-head">
            <div className="page-head-row">
              <div>
                <div className="eyebrow">
                  <Icon d={I.headphones} size={16} /> {t.audio.eyebrow}
                </div>
                <h1>{t.audio.title}</h1>
                <p>
                  {t.audio.intro}
                  {total > 0 && ` ${plural(locale, t.audio.titles, total)}`}
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
              <h3>{t.audio.noPage}</h3>
              <p>{plural(locale, t.audio.pagesCount, totalPages)}</p>
              <Link href="/livres-audio" className="btn btn-primary">
                {t.audio.firstPage}
              </Link>
            </div>
          ) : (
            <div className="empty">
              <h3>{t.audio.empty}</h3>
              <p>{t.audio.emptyHint}</p>
              <Link href="/catalogue" className="btn btn-primary">
                {t.audio.browse}
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
