import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { i18nAlternates } from "@/i18n/seo";
import { categoryLabel, fmt, plural } from "@/i18n/format";
import { notFound } from "next/navigation";
import DesignShell from "@/components/design/shell";
import BookCard from "@/components/design/book-card";
import Icon, { I } from "@/components/design/icon";
import { searchBooks } from "@/lib/books";
import prisma from "@/lib/db";
import { SITE_NAME } from "@/lib/site";
import JsonLd, { breadcrumbLd, itemListLd } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Rendu à la demande : la langue vient de l'URL (/en/categorie/…) via le middleware,
// une page pré-rendue au build serait servie en français pour toutes les langues.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [category, { locale, t }] = await Promise.all([
    prisma.category.findUnique({ where: { slug } }),
    getServerI18n(),
  ]);
  if (!category) return { title: t.meta.categoryNotFound };
  const name = categoryLabel(t, category);
  return {
    title: fmt(t.meta.categoryTitle, { name }),
    description:
      (locale === "fr" && category.description) || fmt(t.meta.categoryDesc, { name, site: SITE_NAME }),
    alternates: i18nAlternates(locale, `/categorie/${slug}`),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();
  const { locale, t } = await getServerI18n();
  const name = categoryLabel(t, category);

  const { books, total, totalPages } = await searchBooks({ category: slug, page, sort: "popular" });

  return (
    <DesignShell>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.nav.home, url: "/" },
            { name: t.nav.catalogue, url: "/catalogue" },
            { name, url: `/categorie/${slug}` },
          ], locale),
          ...(books.length > 0 ? [itemListLd(books, fmt(t.category.booksOf, { name }), locale)] : []),
        ]}
      />
      <div className="wrap">
        <nav className="breadcrumb" aria-label={t.common.breadcrumb} style={{ paddingTop: 16 }}>
          <Link href="/">{t.nav.home}</Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalogue">{t.nav.catalogue}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{name}</span>
        </nav>
        <div className="page-head">
          <div>
            <h1>{name}</h1>
            <p>
              {plural(locale, t.category.freeBooks, total)}
              {locale === "fr" && category.description ? ` — ${category.description}` : ""}
            </p>
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
            <h3>{t.category.empty}</h3>
            <Link href="/catalogue" className="btn btn-primary">
              {t.category.seeCatalogue}
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="load-more" style={{ gap: 12 }}>
            {page > 1 && (
              <Link className="btn btn-outline" href={page - 1 === 1 ? `/categorie/${slug}` : `/categorie/${slug}?page=${page - 1}`}>
                <Icon d={I.chevL} /> {t.common.previous}
              </Link>
            )}
            <span style={{ alignSelf: "center", color: "var(--muted)" }}>
              {fmt(t.common.pageOf, { page, total: totalPages })}
            </span>
            {page < totalPages && (
              <Link className="btn btn-outline" href={`/categorie/${slug}?page=${page + 1}`}>
                {t.common.next} <Icon d={I.chevR} />
              </Link>
            )}
          </div>
        )}
      </div>
    </DesignShell>
  );
}
