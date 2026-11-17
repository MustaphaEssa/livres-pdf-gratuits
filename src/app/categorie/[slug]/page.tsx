import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { categoryLabel, fmt, plural } from "@/i18n/format";
import { notFound } from "next/navigation";
import DesignShell from "@/components/design/shell";
import BookCard from "@/components/design/book-card";
import Icon, { I } from "@/components/design/icon";
import { searchBooks } from "@/lib/books";
import prisma from "@/lib/db";
import { pageMetadata, withPage, tpl, clip, titleList, MAX_INDEXED_PAGE } from "@/lib/seo";
import { seoMessages } from "@/i18n/seo-messages";
import type { Metadata } from "next";
import JsonLd, { breadcrumbLd, itemListLd } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Rendu à la demande : la langue vient de l'URL (/en/categorie/…) via le middleware,
// une page pré-rendue au build serait servie en français pour toutes les langues.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const [category, { locale, t }] = await Promise.all([
    prisma.category.findUnique({ where: { slug } }),
    getServerI18n(),
  ]);
  if (!category) return { title: t.meta.categoryNotFound, robots: { index: false, follow: true } };
  const name = categoryLabel(t, category);
  const { books, total } = await searchBooks({ category: slug, page: 1, sort: "popular" });
  const baseTitle = fmt(t.meta.categoryTitle, { name });
  // Description unique par catégorie et par langue : nombre de livres + titres phares
  const description =
    page === 1 && locale === "fr" && category.description && category.description.length >= 120
      ? clip(category.description, 160)
      : clip(tpl(seoMessages(locale).categoryDesc, { name, n: total, titles: titleList(books.map((b) => b.title)) }), 160);
  return pageMetadata({
    locale,
    path: withPage(`/categorie/${slug}`, page),
    title: page > 1 ? `${baseTitle} — ${fmt(t.common.page, { n: page })}` : baseTitle,
    description,
    noindex: page > MAX_INDEXED_PAGE || total === 0,
  });
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
  const seo = seoMessages(locale);
  // FAQ visible (page 1 seulement) + balisage FAQPage identique au texte affiché
  const faq =
    page === 1 && total > 0
      ? seo.faq.map(({ q, a }) => ({ q: tpl(q, { name, n: total }), a: tpl(a, { name, n: total }) }))
      : [];

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
          ...(faq.length
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faq.map((f) => ({
                    "@type": "Question",
                    name: f.q,
                    acceptedAnswer: { "@type": "Answer", text: f.a },
                  })),
                },
              ]
            : []),
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

        {faq.length > 0 && (
          <section className="category-faq" aria-labelledby="faq-title" style={{ margin: "48px 0 24px", maxWidth: 760 }}>
            <h2 id="faq-title">{seo.faqTitle}</h2>
            {faq.map((f) => (
              <details key={f.q} style={{ borderTop: "1px solid var(--line)", padding: "14px 0" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  <h3 style={{ display: "inline", fontSize: "inherit", fontWeight: "inherit" }}>{f.q}</h3>
                </summary>
                <p style={{ marginTop: 8, color: "var(--muted)" }}>{f.a}</p>
              </details>
            ))}
          </section>
        )}
      </div>
    </DesignShell>
  );
}
