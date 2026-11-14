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
import { getBooksByAuthorSlug, getCategoriesWithCounts } from "@/lib/books";
import { getAuthorInfo, formatAuthorName } from "@/lib/authors";
import JsonLd, { breadcrumbLd, itemListLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params;
  const [{ authorName, total }, { locale, t }] = await Promise.all([getBooksByAuthorSlug(slug, 1), getServerI18n()]);
  if (!authorName) return { title: t.meta.authorNotFound };
  const name = formatAuthorName(authorName);
  return {
    title: `${name} — ${plural(locale, t.common.books, total)}`,
    description: fmt(t.meta.authorDesc, { name }),
    alternates: i18nAlternates(locale, `/auteur/${slug}`),
  };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const { locale, t } = await getServerI18n();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ books, total, totalPages, authorName }, categories] = await Promise.all([
    getBooksByAuthorSlug(slug, page),
    getCategoriesWithCounts(),
  ]);
  if (!authorName || total === 0) notFound();

  const author = await getAuthorInfo(slug, authorName);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `${SITE_URL}${localizePath(locale, `/auteur/${slug}`)}`,
    ...(author.image ? { image: author.image } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.birthYear ? { birthDate: String(author.birthYear) } : {}),
    ...(author.deathYear ? { deathDate: String(author.deathYear) } : {}),
  };

  return (
    <div className="ma">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.nav.home, url: "/" },
            { name: t.nav.authors, url: "/auteurs" },
            { name: author.name, url: `/auteur/${slug}` },
          ], locale),
          personLd,
          itemListLd(books, fmt(t.authors.booksOf, { name: author.name }), locale),
        ]}
      />
      <DesignHeader />
      <main className="page-main" id="contenu">
        <div className="wrap">
          <nav className="breadcrumb" aria-label={t.common.breadcrumb} style={{ paddingTop: 16 }}>
            <Link href="/">{t.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/auteurs">{t.nav.authors}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{author.name}</span>
          </nav>

          <div className="page-head">
            <div className="author-card" style={{ borderRadius: 24 }}>
              {author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="avatar"
                  src={author.image}
                  alt={author.name}
                  style={{ width: 96, height: 96, objectFit: "cover" }}
                />
              ) : (
                <span className="avatar" aria-hidden="true" style={{ width: 96, height: 96, fontSize: 40 }}>
                  {[...author.name][0]}
                </span>
              )}
              <div>
                <h1 style={{ fontSize: 34 }}>{author.name}</h1>
                {(author.birthYear || author.deathYear) && (
                  <p style={{ color: "var(--muted)", fontSize: 15 }}>
                    {author.birthYear ?? "?"} – {author.deathYear ?? "?"}
                  </p>
                )}
                <p style={{ color: "var(--muted)", margin: "4px 0 8px" }}>
                  {plural(locale, t.authors.booksAvailable, total)}
                </p>
                {author.bio && <p>{author.bio}</p>}
              </div>
            </div>
          </div>

          <div className="grid-books">
            {books.map((b) => (
              <BookCard key={b.slug} book={b} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="load-more" style={{ gap: 12 }}>
              {page > 1 && (
                <Link className="btn btn-outline" href={`/auteur/${slug}${page - 1 === 1 ? "" : `?page=${page - 1}`}`}>
                  <Icon d={I.chevL} /> {t.common.previous}
                </Link>
              )}
              <span style={{ alignSelf: "center", color: "var(--muted)" }}>
                {fmt(t.common.pageOf, { page, total: totalPages })}
              </span>
              {page < totalPages && (
                <Link className="btn btn-outline" href={`/auteur/${slug}?page=${page + 1}`}>
                  {t.common.next} <Icon d={I.chevR} />
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
