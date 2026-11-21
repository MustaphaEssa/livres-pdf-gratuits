import { languageLabel } from "@/lib/languages";
import Link from "@/i18n/navigation";
import { notFound } from "next/navigation";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookActionBar from "@/components/design/book-action-bar";
import BookCover from "@/components/design/book-cover";
import BookMini from "@/components/design/book-mini";
import BookCard from "@/components/design/book-card";
import BuyCard from "@/components/design/buy-card";
import FavButton from "@/components/design/fav-button";
import Icon, { I } from "@/components/design/icon";
import { ZelligePattern } from "@/components/design/patterns";
import { AudioPlayer } from "@/components/books/audio-player";
import { ShareButtons } from "@/components/books/share-buttons";
import { Reviews } from "@/components/books/reviews";
import { RatePrompt } from "@/components/books/rate-prompt";
import { formatFileSize, formatAuthorName } from "@/lib/utils";
import { localizedBio } from "@/lib/author-bios";
import {
  getBookBySlug,
  getRelatedBooks,
  getSameAuthorBooks,
  getBooksByGenre,
  getAuthorProfile,
  incrementViewCount,
  parseAudioTracks,
} from "@/lib/books";
import { getUserSession } from "@/lib/user-server";
import { getSiteSettings } from "@/lib/settings";
import prisma from "@/lib/db";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { headers } from "next/headers";
import { shouldCountView } from "@/lib/view-throttle";
import { isBot } from "@/lib/bot";
import { getServerI18n } from "@/i18n/server";
import { localizePath } from "@/i18n/config";
import { bookIndexLocales } from "@/i18n/seo";
import { isLowValueBook } from "@/lib/book-quality";
import { categoryLabel, fmt, formatNumber, authorLabel } from "@/i18n/format";
import { isUsefulDescription, autoDescription, truncateText } from "@/lib/book-description";
import { pageMetadata, descriptionWithCta, clip, absoluteUrl } from "@/lib/seo";
import { seoMessages } from "@/i18n/seo-messages";
import { seoContent, fill } from "@/i18n/seo-content";
import type { Metadata } from "next";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [book, { locale, t }] = await Promise.all([getBookBySlug(slug), getServerI18n()]);
  if (!book) return { title: t.meta.bookNotFound, robots: { index: false, follow: true } };
  const seo = seoMessages(locale);
  const isAudio = book.mediaType === "AUDIO";
  // Description : texte de la source s'il est utile, sinon description générée
  // (les notes techniques d'Internet Archive font de mauvais extraits Google).
  const metaGenre = book.categories[0]?.category;
  // Le texte de la source est dans la langue du livre (ou en français pour les
  // fiches générées à l'import) : ailleurs, on donne une description dans la
  // langue de la page (une meta unique par version linguistique).
  const sourceFits = locale === "fr" || locale === book.language;
  const baseDesc =
    sourceFits && isUsefulDescription(book.description)
      ? book.description
      : autoDescription(t, locale, { ...book, hasAudio: !!book.audioTracks }, metaGenre ? categoryLabel(t, metaGenre) : null);
  const metaDesc = descriptionWithCta(baseDesc, isAudio ? seo.audioCta : seo.bookCta);
  const title = bookSeoTitle(book.title, book.author, isAudio ? seo.audioSuffix : seo.bookSuffix);
  return pageMetadata({
    locale,
    path: `/livre/${book.slug}`,
    title,
    absoluteTitle: true,
    description: metaDesc,
    type: "book",
    indexLocales: bookIndexLocales(book.language),
    // Revue, bulletin, catalogue… ou livre téléchargé nulle part : hors index (reste accessible)
    noindex: isLowValueBook(book),
    // Carte 1200×630 générée (couverture + titre), cf. /og/livre/[slug]
    image: { url: `/og/livre/${encodeURIComponent(book.slug)}`, width: 1200, height: 630, alt: book.title },
    openGraphExtra: {
      authors: [book.author],
      ...(book.isbn ? { isbn: book.isbn } : {}),
      ...(book.publishedYear ? { releaseDate: String(book.publishedYear) } : {}),
    },
  });
}

/**
 * « {Titre} - {Auteur} | Télécharger PDF gratuit » en 60 caractères max :
 * sans l'auteur si trop long, puis titre raccourci au dernier mot entier.
 */
function bookSeoTitle(title: string, author: string, suffix: string): string {
  const name = formatAuthorName(author);
  // Titre principal sans sous-titre : « Madame Bovary: mœurs de province » → « Madame Bovary »
  const main = title.split(/\s*[:;/(\[]\s*|\s+[-–—]\s+/)[0].trim();
  const candidates = [
    name && `${title} - ${name} | ${suffix}`,
    name && main.length >= 3 && main !== title && `${main} - ${name} | ${suffix}`,
    `${title} | ${suffix}`,
    main.length >= 3 && `${main} | ${suffix}`,
  ];
  const fit = candidates.find((c): c is string => !!c && c.length <= 60);
  return fit ?? `${clip(main.length >= 3 ? main : title, Math.max(20, 60 - suffix.length - 3))} | ${suffix}`;
}


export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const bookMediaType = book.mediaType === "AUDIO" ? "AUDIO" : "PDF";
  const genreSlug = book.categories[0]?.category.slug;
  const [hdrs, { locale, t }, relatedBooks, sameAuthorBooks, genreBooks, rawAuthorProfile, settings, session] =
    await Promise.all([
      headers(),
      getServerI18n(),
      getRelatedBooks(book.id, book.categories.map((c) => c.categoryId), 4),
      getSameAuthorBooks(book.id, book.authorSlug, 4, bookMediaType),
      getBooksByGenre(genreSlug, book.id, 4, bookMediaType),
      getAuthorProfile(book.authorSlug),
      getSiteSettings(),
      getUserSession(),
    ]);

  // Bio de l'auteur dans la langue de la page (vide si Wikipédia n'a pas d'article dans cette langue)
  const authorProfile = rawAuthorProfile && { ...rawAuthorProfile, bio: localizedBio(locale, rawAuthorProfile) };

  const viewerIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  if (!isBot(hdrs.get("user-agent")) && shouldCountView(book.id, viewerIp)) incrementViewCount(book.id).catch(() => {});

  const isLoggedIn = !!session;
  let isFavorited = false;
  if (session) {
    isFavorited = !!(await prisma.favorite.findUnique({
      where: { userId_bookId: { userId: session.sub, bookId: book.id } },
    }));
  }

  const primaryCategory = book.categories[0]?.category;
  const downloadHref = `/livre/${book.slug}/telecharger`;
  const readerHref = `/livre/${book.slug}/lire`;
  const audioTracks = parseAudioTracks(book.audioTracks);
  const hasAudio = audioTracks.length > 0;
  const hasPdf = !!book.pdfUrl;
  const langLabel = languageLabel(book.language);
  const reportEmail = settings.email || "contact@livrespdfgratuits.com";
  const bookUrl = `${SITE_URL}${localizePath(locale, `/livre/${book.slug}`)}`;
  const reportHref = `mailto:${reportEmail}?subject=${encodeURIComponent(
    fmt(t.book.reportSubject, { title: book.title })
  )}&body=${encodeURIComponent(fmt(t.book.reportBody, { title: book.title, url: bookUrl }))}`;
  const primaryCategoryLabel = primaryCategory ? categoryLabel(t, primaryCategory) : "";
  // Texte « À propos » : description de la source si utile, sinon générée
  const usefulDesc = isUsefulDescription(book.description) ? book.description : null;
  const aboutText =
    usefulDesc ?? autoDescription(t, locale, { ...book, hasAudio }, primaryCategoryLabel || null);
  const fmtDuration = (sec?: number | null) => {
    if (!sec || sec <= 0) return "—";
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h ? fmt(t.book.hoursMinutes, { h, m: String(m).padStart(2, "0") }) : fmt(t.book.minutes, { m });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: {
      "@type": "Person",
      name: formatAuthorName(book.author),
      ...(book.authorSlug ? { url: `${SITE_URL}${localizePath(locale, `/auteur/${book.authorSlug}`)}` } : {}),
    },
    inLanguage: book.language,
    url: bookUrl,
    description: truncateText(
      locale === "fr" || locale === book.language
        ? aboutText
        : autoDescription(t, locale, { ...book, hasAudio }, primaryCategoryLabel || null),
      300
    ),
    ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
    ...(book.publishedYear ? { datePublished: String(book.publishedYear) } : {}),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.publisher ? { publisher: { "@type": "Organization", name: book.publisher } } : {}),
    ...(book.coverImage ? { image: absoluteUrl(book.coverImage) } : {}),
    ...(primaryCategoryLabel ? { genre: primaryCategoryLabel } : {}),
    ...(bookMediaType === "AUDIO"
      ? { bookFormat: "https://schema.org/AudiobookFormat" }
      : { bookFormat: "https://schema.org/EBook", ...(hasPdf ? { encodingFormat: "application/pdf" } : {}) }),
    // Livre gratuit : offre à 0 (Google attend price + priceCurrency)
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: bookUrl,
    },
    ...(book.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: book.rating, reviewCount: book.ratingCount } }
      : {}),
    isAccessibleForFree: true,
    provider: { "@type": "Organization", name: SITE_NAME },
  };
  // FAQ propre au livre (vise « {titre} pdf gratuit ») — livres PDF uniquement
  const sc = seoContent(locale);
  const faqVars = {
    title: book.title,
    author: authorLabel(t, book.author),
    formats: [hasPdf && "PDF", book.epubUrl && "EPUB", hasAudio && t.common.audio].filter(Boolean).join(", "),
  };
  const bookFaq = hasPdf ? sc.bookFaq.map((f) => ({ q: fill(f.q, faqVars), a: fill(f.a, faqVars) })) : [];
  const faqJsonLd = bookFaq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: bookFaq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;
  // Lien d'attribution seulement pour un extrait externe (Wikipédia) ; nos textes
  // éditoriaux (« editorial|… ») n'en ont pas.
  const summarySource = usefulDesc && book.descriptionSource?.startsWith("http") ? book.descriptionSource : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.nav.home, item: `${SITE_URL}${localizePath(locale, "/")}` },
      { "@type": "ListItem", position: 2, name: t.nav.catalogue, item: `${SITE_URL}${localizePath(locale, "/catalogue")}` },
      ...(primaryCategory
        ? [{ "@type": "ListItem", position: 3, name: primaryCategoryLabel, item: `${SITE_URL}${localizePath(locale, `/categorie/${primaryCategory.slug}`)}` }]
        : []),
      { "@type": "ListItem", position: primaryCategory ? 4 : 3, name: book.title, item: bookUrl },
    ],
  };

  return (
    <div className="ma">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <DesignHeader />

      <main className="page-main" id="contenu">
        <div className="wrap book-page">
          <nav className="breadcrumb" aria-label={t.common.breadcrumb}>
            <Link href="/">{t.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/catalogue">{t.nav.catalogue}</Link>
            {primaryCategory && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/categorie/${primaryCategory.slug}`}>{primaryCategoryLabel}</Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page" dir="auto">
              {book.title}
            </span>
          </nav>

          <section className="book-hero">
            <ZelligePattern id="z-book" />
            <div className="book-hero-cover">
              <div className="arch-door" />
              <BookCover book={book} priority />
            </div>
            <div className="book-hero-info">
              <div className="badges">
                {primaryCategory && (
                  <Link className="badge badge-genre" href={`/categorie/${primaryCategory.slug}`}>
                    {primaryCategoryLabel}
                  </Link>
                )}
                {hasPdf && <span className="badge badge-pdf">PDF</span>}
                {book.epubUrl && <span className="badge badge-pdf">EPUB</span>}
                {hasPdf && <span className="badge badge-read">{t.book.readOnline}</span>}
                {hasAudio && <span className="badge badge-audio-tag">{t.common.audio}</span>}
              </div>
              <h1 dir="auto">{book.title}</h1>
              <div className="byline">
                <span>{t.book.by}</span>
                <Link
                  className="author"
                  href={book.authorSlug ? `/auteur/${book.authorSlug}` : `/catalogue?q=${encodeURIComponent(book.author)}`}
                  dir="auto"
                >
                  {authorLabel(t, book.author)}
                </Link>
                {book.publishedYear && <span>· {book.publishedYear}</span>}
              </div>
              <dl className="tile-list">
                <div className="tile">
                  <dt>{t.book.language}</dt>
                  <dd>{langLabel}</dd>
                </div>
                {hasAudio ? (
                  <div className="tile">
                    <dt>{t.book.duration}</dt>
                    <dd>{fmtDuration(book.audioDuration)}</dd>
                  </div>
                ) : (
                  <div className="tile">
                    <dt>{t.book.pages}</dt>
                    <dd>{book.pageCount ?? "—"}</dd>
                  </div>
                )}
                <div className="tile">
                  <dt>{t.book.downloads}</dt>
                  <dd>{formatNumber(locale, book.downloadCount)}</dd>
                </div>
              </dl>
              <div className="actions">
                {hasPdf && (
                  <a className="btn btn-primary btn-lg" href={downloadHref} data-rate-trigger>
                    <Icon d={I.download} /> {t.book.downloadPdf}
                  </a>
                )}
                {hasPdf && (
                  <Link className="btn btn-outline btn-lg" href={readerHref}>
                    <Icon d={I.book} /> {t.book.readOnline}
                  </Link>
                )}
                {hasAudio && (
                  <a className="btn btn-outline btn-lg" href="#ecouter">
                    <Icon d={I.headphones} /> {t.book.listen}
                  </a>
                )}
                <FavButton bookId={book.id} title={book.title} initialFavorited={isFavorited} isLoggedIn={isLoggedIn} />
                <ShareButtons url={bookUrl} title={book.title} />
              </div>
            </div>
          </section>

          <div className="detail-layout">
            <div className="detail-main">
              <section aria-labelledby="about">
                <h2 id="about">{t.book.about}</h2>
                {/* Descriptions éditoriales en plusieurs paragraphes (séparés par une ligne vide) */}
                {aboutText
                  .split(/\n\s*\n/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i} className="prose" dir="auto" style={i > 0 ? { marginTop: 12 } : undefined}>
                      {para}
                    </p>
                  ))}
                {summarySource && (
                  <p className="small-note" style={{ marginTop: 8 }}>
                    <a href={summarySource} target="_blank" rel="noopener">
                      {sc.summarySource}
                    </a>
                  </p>
                )}
              </section>

              {hasAudio && (
                <section id="ecouter" aria-labelledby="listen" style={{ scrollMarginTop: 90 }}>
                  <h2 id="listen">{t.book.listenOnline}</h2>
                  <AudioPlayer tracks={audioTracks} totalDuration={book.audioDuration ?? undefined} />
                </section>
              )}

              {authorProfile && (authorProfile.bio || authorProfile.image) && (
                <section aria-labelledby="author">
                  <h2 id="author">{t.book.theAuthor}</h2>
                  <div className="author-card">
                    {authorProfile.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="avatar"
                        src={authorProfile.image}
                        alt={authorProfile.name}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <span className="avatar" aria-hidden="true">
                        {[...authorProfile.name][0]}
                      </span>
                    )}
                    <div>
                      <h3 dir="auto">{authorProfile.name}</h3>
                      {authorProfile.bio && <p>{authorProfile.bio}</p>}
                      {book.authorSlug && (
                        <Link href={`/auteur/${book.authorSlug}`} className="link-arrow" style={{ marginTop: 8 }}>
                          {t.book.allTheirBooks} <Icon d={I.arrow} />
                        </Link>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {sameAuthorBooks.length > 0 && (
                <section aria-labelledby="same-author">
                  <h2 id="same-author">{t.book.sameAuthor}</h2>
                  <div className="mini-grid">
                    {sameAuthorBooks.map((b) => (
                      <BookMini key={b.slug} book={b} />
                    ))}
                  </div>
                </section>
              )}

              {genreBooks.length > 0 && primaryCategory && (
                <section aria-labelledby="genre">
                  <h2 id="genre">{fmt(t.book.moreOf, { genre: primaryCategoryLabel.toLocaleLowerCase(locale) })}</h2>
                  <div className="mini-grid">
                    {genreBooks.map((b) => (
                      <BookMini key={b.slug} book={b} />
                    ))}
                  </div>
                </section>
              )}

              {bookFaq.length > 0 && (
                <section aria-labelledby="book-faq">
                  <h2 id="book-faq">{sc.bookFaqTitle}</h2>
                  {bookFaq.map((f) => (
                    <details key={f.q} style={{ borderTop: "1px solid var(--line)", padding: "14px 0" }}>
                      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                        <h3 style={{ display: "inline", fontSize: "inherit", fontWeight: "inherit" }} dir="auto">
                          {f.q}
                        </h3>
                      </summary>
                      <p style={{ marginTop: 8, color: "var(--muted)" }} dir="auto">
                        {f.a}
                      </p>
                    </details>
                  ))}
                </section>
              )}

              <section aria-labelledby="reviews">
                <h2 id="reviews">{t.book.reviews}</h2>
                <Reviews bookId={book.id} isLoggedIn={isLoggedIn} />
                <RatePrompt bookId={book.id} />
              </section>
            </div>

            <aside className="detail-aside" aria-label={t.book.readOrDownload}>
              <div className="download-card">
                <h2>{t.book.readOrDownload}</h2>
                <div className="notice">
                  <Icon d={I.shield} size={22} />
                  <span>{t.book.publicDomainNotice}</span>
                </div>

                {hasPdf && (
                  <Link className="btn btn-ink btn-xl" href={readerHref}>
                    <Icon d={I.book} /> {t.book.openReader}
                  </Link>
                )}
                {hasAudio && (
                  <a className="btn btn-ink btn-xl" href="#ecouter">
                    <Icon d={I.headphones} /> {t.book.listenOnline}
                  </a>
                )}

                {hasPdf && (
                  <>
                    <div className="divider" />
                    <div className="dl-block">
                      <div className="row">
                        <strong>PDF</strong>
                        <span>{book.pdfSize ? formatFileSize(book.pdfSize) : ""}</span>
                      </div>
                      <p>{t.book.pdfOffline}</p>
                      <a className="btn btn-primary btn-xl" href={downloadHref} data-rate-trigger>
                        <Icon d={I.download} /> {t.book.downloadPdf}
                      </a>
                    </div>
                  </>
                )}

                {book.epubUrl && (
                  <>
                    <div className="divider" />
                    <div className="dl-block">
                      <div className="row">
                        <strong>EPUB</strong>
                        <span>{t.book.epubDevice}</span>
                      </div>
                      <p>{t.book.epubIdeal}</p>
                      <a className="btn btn-outline btn-xl" href={book.epubUrl} target="_blank" rel="noopener noreferrer" data-rate-trigger>
                        <Icon d={I.download} /> {t.book.downloadEpub}
                      </a>
                      <a
                        className="btn btn-outline btn-xl"
                        href="https://www.amazon.com/sendtokindle"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon d={I.external} /> {t.book.sendKindle}
                      </a>
                    </div>
                  </>
                )}

                <p className="small-note">
                  {t.book.problem} <Link href="/contact">{t.book.contactUs}</Link>.
                </p>
                <a className="report" href={reportHref}>
                  <Icon d={I.flag} size={16} /> {t.book.report}
                </a>{" "}
                <Link className="small-note" href="/dmca">
                  {t.book.dmcaPolicy}
                </Link>
              </div>

              <BuyCard
                locale={locale}
                title={book.title}
                author={book.author}
                isbn={book.isbn}
                hasAudio={hasAudio || book.mediaType === "AUDIO"}
              />

              <div className="facts-card">
                <h2>{t.book.facts}</h2>
                <dl className="facts">
                  <div>
                    <dt>{t.book.title}</dt>
                    <dd dir="auto">{book.title}</dd>
                  </div>
                  <div>
                    <dt>{t.book.author}</dt>
                    <dd dir="auto">{authorLabel(t, book.author)}</dd>
                  </div>
                  {primaryCategory && (
                    <div>
                      <dt>{t.book.genre}</dt>
                      <dd>{primaryCategoryLabel}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t.book.language}</dt>
                    <dd>{langLabel}</dd>
                  </div>
                  {book.pageCount && (
                    <div>
                      <dt>{t.book.pages}</dt>
                      <dd>{book.pageCount}</dd>
                    </div>
                  )}
                  {book.publishedYear && (
                    <div>
                      <dt>{t.book.publication}</dt>
                      <dd>{book.publishedYear}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t.book.formats}</dt>
                    <dd>
                      {[hasPdf && "PDF", book.epubUrl && "EPUB", hasAudio && t.common.audio].filter(Boolean).join(" · ") || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.book.license}</dt>
                    <dd>{t.common.publicDomain}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>

          {relatedBooks.length > 0 && (
            <div className="like-band" style={{ marginInline: "calc(50% - 50vw)" }}>
              <div className="like-inner">
                <div className="section-head">
                  <h2>{t.book.similar}</h2>
                </div>
                <div className="like-grid">
                  {relatedBooks.map((b) => (
                    <BookCard key={b.slug} book={b} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <DesignFooter categories={book.categories.map((c) => c.category)} />
      <BookActionBar
        readerHref={hasPdf ? readerHref : null}
        downloadHref={hasPdf ? downloadHref : null}
        listenHref={hasAudio ? "#ecouter" : null}
      />
      <MobileTabbar />
    </div>
  );
}
