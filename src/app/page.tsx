import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { i18nAlternates } from "@/i18n/seo";
import { categoryLabel, fmt, formatDateLocale, plural, authorLabel } from "@/i18n/format";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCover from "@/components/design/book-cover";
import HeroSearch from "@/components/design/hero-search";
import HeroArch from "@/components/design/hero-arch";
import LangShelf from "@/components/design/lang-shelf";
import Icon, { I } from "@/components/design/icon";
import { ZelligePattern } from "@/components/design/patterns";
import JsonLd, { websiteLd, organizationLd, itemListLd } from "@/components/seo/json-ld";
import BookCard from "@/components/design/book-card";
import {
  getFeaturedBooks,
  getLatestBooks,
  getBooksByLang,
  getLanguagesWithCounts,
  getCategoriesWithCounts,
  getTopAuthors,
  getLatestAudiobooks,
} from "@/lib/books";
import { getHomeCollections } from "@/lib/collections";
import { localizeCollection } from "@/i18n/collections";
import { getLatestPosts, blogLanguageFor } from "@/lib/posts";
import { languageLabel, sortLanguages } from "@/lib/languages";
import { seoContent, fill } from "@/i18n/seo-content";

// Icônes (tracés SVG) par catégorie
const CAT_ICON: Record<string, string> = {
  romans: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z M6 19h13",
  histoire: "M3 10 12 4l9 6H3Z M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 20h18",
  biographies: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21c0-4 3.6-7 8-7s8 3 8 7",
  poesie: "M20 4c-7 0-12 4-12 11l-3 5 M20 4c0 7-4 11-11 11 M12 12h5",
  philosophie: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z",
  sciences: "M9 3h6 M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19l-5-10V3 M7.5 15h9",
  religion: "M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2V5Z M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8V5Z",
  informatique: "M8 8l-5 4 5 4 M16 8l5 4-5 4 M14 5l-4 14",
};

export async function generateMetadata() {
  const { locale } = await getServerI18n();
  return { alternates: i18nAlternates(locale, "/") };
}

export default async function HomePage() {
  const { locale, t } = await getServerI18n();
  // Étagère par langue : les 5 premières langues présentes (FR, EN, ES, AR… selon le catalogue)
  const allLangs = await getLanguagesWithCounts();
  const shelfLangs = sortLanguages(allLangs).slice(0, 5);
  // Texte de présentation + FAQ (vise « livres pdf gratuits ») ; nombre arrondi à la centaine
  const sc = seoContent(locale);
  const totalBooks = allLangs.reduce((n, l) => n + l.count, 0);
  const booksLabel = new Intl.NumberFormat(locale).format(
    totalBooks >= 1000 ? Math.floor(totalBooks / 100) * 100 : totalBooks
  ) + (totalBooks >= 1000 ? "+" : "");
  const homeFaq = sc.homeFaq;

  const [newest, langBooks, featured, categories, collections, authors, audiobooks, posts] =
    await Promise.all([
      getLatestBooks(8),
      Promise.all(shelfLangs.map((l) => getBooksByLang(l.code, 8))),
      getFeaturedBooks(6),
      getCategoriesWithCounts(),
      getHomeCollections(4).then((cs) => cs.map((c) => localizeCollection(locale, c))),
      getTopAuthors(10),
      getLatestAudiobooks(6),
      blogLanguageFor(locale).then((lang) => getLatestPosts(3, lang)),
    ]);

  // Arche « à la une » : données minimales sérialisables pour le composant client
  const hero = featured.slice(0, 5).map((b) => ({
    slug: b.slug,
    title: b.title,
    author: b.author,
    coverImage: b.coverImage,
    language: b.language,
    hasPdf: !!b.pdfUrl,
  }));

  return (
    <div className="ma">
      <JsonLd
        data={[
          websiteLd(locale),
          organizationLd(),
          itemListLd(featured, t.home.featuredTitle, locale),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: homeFaq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
      <DesignHeader />

      <main className="page-main" id="contenu">
        <div className="hero-wrap">
          <ZelligePattern id="z-hero" className="fade" />
          <section className="hero">
            <div className="hero-copy">
              <span className="pill-label">{t.home.pill}</span>
              <h1>
                {t.home.heroBefore}
                <em>{t.home.heroEm}</em>
                {t.home.heroAfter}
              </h1>
              <p className="lead">{t.home.heroLead}</p>
              <HeroSearch />
            </div>
            <div className="hero-visual">
              <HeroArch books={hero} />
            </div>
          </section>
        </div>

        {/* Emplacement réservé à un bandeau publicitaire (ex-bandeau de stats,
            masqué tant que le catalogue est petit). */}

        <LangShelf
          newest={newest}
          langs={shelfLangs.map((l, i) => ({ code: l.code, label: languageLabel(l.code), books: langBooks[i] }))}
        />

        {collections.length > 0 && (
          <section className="section wrap" aria-labelledby="lists-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">{t.home.listsEyebrow}</div>
                <h2 id="lists-title">{t.home.listsTitle}</h2>
              </div>
              <Link href="/collections" className="link-arrow">
                {t.home.allCollections} <Icon d={I.arrow} />
              </Link>
            </div>
            <div className="list-grid">
              {collections.map((c) => (
                <Link key={c.id} href={`/collections/${c.slug}`} className="list-card">
                  <span className="list-stack" aria-hidden="true">
                    {c.books.map(({ book }) => (
                      <span key={book.slug} className="list-stack-item">
                        <BookCover book={book} />
                      </span>
                    ))}
                  </span>
                  <span className="list-card-text">
                    <span className="list-card-title">{c.title}</span>
                    {c.description && <span className="list-card-desc">{c.description}</span>}
                    <span className="list-card-count">
                      {plural(locale, t.common.books, c._count.books)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section wrap" aria-labelledby="genres-title">
          <div className="section-head">
            <div>
              <div className="eyebrow">{t.home.exploreEyebrow}</div>
              <h2 id="genres-title">{t.home.genresTitle}</h2>
            </div>
            <Link href="/catalogue" className="link-arrow">
              {t.home.allCatalogue} <Icon d={I.arrow} />
            </Link>
          </div>
          <div className="genre-grid">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/categorie/${c.slug}`}
                className={`genre-tile ${i === 0 ? "is-primary" : ""}`}
              >
                <span className="genre-icon">
                  <Icon d={CAT_ICON[c.slug] || I.book} size={24} />
                </span>
                <span className="genre-foot">
                  <span>
                    <span className="genre-name">{categoryLabel(t, c)}</span>
                    <span className="genre-count">{plural(locale, t.common.books, c.count)}</span>
                  </span>
                  <span className="genre-arrow">
                    <Icon d={I.arrow} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {authors.length > 0 && (
          <section className="section wrap" aria-labelledby="authors-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">{t.home.authorsEyebrow}</div>
                <h2 id="authors-title">{t.home.authorsTitle}</h2>
              </div>
              <Link href="/auteurs" className="link-arrow">
                {t.home.allAuthors} <Icon d={I.arrow} />
              </Link>
            </div>
            <ul className="author-rail">
              {authors.map((a) => (
                <li key={a.slug}>
                  <Link href={`/auteur/${a.slug}`} className="author-chip">
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="author-photo" src={a.image} alt="" loading="lazy" />
                    ) : (
                      <span className="author-photo" aria-hidden="true">
                        {[...a.name][0]}
                      </span>
                    )}
                    <span className="author-name" dir="auto">
                      {a.name}
                    </span>
                    <span className="author-count">
                      {plural(locale, t.common.books, a.count)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="band">
          <div className="band-inner">
            <div className="band-copy">
              <div className="eyebrow">{t.home.featuredEyebrow}</div>
              <h2>{t.home.featuredTitle}</h2>
              <p>{t.home.featuredText}</p>
              <Link href="/catalogue" className="btn btn-ink">
                {t.home.seeCatalogue}
              </Link>
            </div>
            <ol className="featured-list">
              {featured.map((b, i) => (
                <li key={b.slug} className="featured-item">
                  <span className="featured-rank">{i + 1}</span>
                  <BookCover book={b} mini />
                  <span className="featured-text">
                    <Link href={`/livre/${b.slug}`} dir="auto">
                      {b.title}
                    </Link>
                    <span dir="auto">{authorLabel(t, b.author)}</span>
                  </span>
                  <Link href={`/livre/${b.slug}`} className="round-link" aria-label={fmt(t.home.seeBookOf, { title: b.title })}>
                    <Icon d={I.arrow} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {audiobooks.length > 0 && (
          <section className="section wrap" aria-labelledby="audio-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">{t.home.audioEyebrow}</div>
                <h2 id="audio-title">{t.home.audioTitle}</h2>
              </div>
              <Link href="/livres-audio" className="link-arrow">
                {t.home.allAudio} <Icon d={I.arrow} />
              </Link>
            </div>
            <div className="shelf">
              {audiobooks.map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
            </div>
          </section>
        )}

        <section className="section wrap" aria-labelledby="about-site-title" style={{ maxWidth: 860 }}>
          <h2 id="about-site-title">{sc.homeTitle}</h2>
          {sc.homeText.map((p, i) => (
            <p key={i} style={{ marginTop: 12, color: "var(--muted)", lineHeight: 1.7 }}>
              {fill(p, { n: booksLabel })}
            </p>
          ))}
          <h3 style={{ marginTop: 28 }}>{sc.homeFaqTitle}</h3>
          {homeFaq.map((f) => (
            <details key={f.q} style={{ borderTop: "1px solid var(--line)", padding: "14px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>{f.q}</summary>
              <p style={{ marginTop: 8, color: "var(--muted)" }}>{f.a}</p>
            </details>
          ))}
        </section>

        <section className="section wrap" aria-labelledby="help-title">
          <div className="help-strip">
            <div className="help-copy">
              <div className="eyebrow">{t.home.helpEyebrow}</div>
              <h2 id="help-title">{t.home.helpTitle}</h2>
              <p>{t.home.helpText}</p>
              <Link href="/blog" className="link-arrow">
                {t.home.readingGuides} <Icon d={I.arrow} />
              </Link>
            </div>
            <ol className="format-cards">
              <li className="format-card">
                <span className="format-num" aria-hidden="true">1</span>
                <span className="tag tag-read">{t.home.f1Tag}</span>
                <p>{t.home.f1Text}</p>
                <p className="opens">
                  {t.home.f1Label} <strong>{t.home.f1Value}</strong>
                </p>
              </li>
              <li className="format-card">
                <span className="format-num" aria-hidden="true">2</span>
                <span className="tag tag-pdf">{t.home.f2Tag}</span>
                <p>{t.home.f2Text}</p>
                <p className="opens">
                  {t.home.f2Label} <strong>{t.home.f2Value}</strong>
                </p>
              </li>
              <li className="format-card">
                <span className="format-num" aria-hidden="true">3</span>
                <span className="tag tag-audio">{t.home.f3Tag}</span>
                <p>{t.home.f3Text}</p>
                <p className="opens">
                  {t.home.f3Label} <Link href="/livres-audio">{t.nav.audiobooks}</Link>
                </p>
              </li>
            </ol>
          </div>
        </section>

        {posts.length > 0 && (
          <section className="section wrap" aria-labelledby="posts-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">{t.home.postsEyebrow}</div>
                <h2 id="posts-title">{t.home.postsTitle}</h2>
              </div>
              <Link href="/blog" className="link-arrow">
                {t.home.allBlog} <Icon d={I.arrow} />
              </Link>
            </div>
            <div className="post-grid">
              {posts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`post-card ${i === 0 ? "is-lead" : ""}`}
                >
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="post-cover" src={post.coverImage} alt="" loading="lazy" />
                  ) : (
                    <span className="post-cover is-empty" aria-hidden="true">
                      <ZelligePattern id={`z-post-${i}`} className="light" />
                    </span>
                  )}
                  <span className="post-body">
                    {post.categories[0] && (
                      <span className="book-cat">{post.categories[0].category.name}</span>
                    )}
                    <span className="post-title">{post.title}</span>
                    {post.excerpt && <span className="post-excerpt">{post.excerpt}</span>}
                    <span className="post-meta">{formatDateLocale(locale, post.publishedAt ?? post.createdAt)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
