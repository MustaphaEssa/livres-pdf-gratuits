import Link from "next/link";
import { notFound } from "next/navigation";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCover from "@/components/design/book-cover";
import BookMini from "@/components/design/book-mini";
import BookCard from "@/components/design/book-card";
import FavButton from "@/components/design/fav-button";
import Icon, { I } from "@/components/design/icon";
import { ZelligePattern } from "@/components/design/patterns";
import { AudioPlayer } from "@/components/books/audio-player";
import { ShareButtons } from "@/components/books/share-buttons";
import { Reviews } from "@/components/books/reviews";
import { formatFileSize, formatAuthorName } from "@/lib/utils";
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
import { getServerI18n } from "@/i18n/server";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Livre non trouvé" };
  const image = book.coverImage
    ? book.coverImage.startsWith("http")
      ? book.coverImage
      : `${SITE_URL}${book.coverImage}`
    : `${SITE_URL}/og-image.png`;
  return {
    title: book.title,
    description: book.description ?? undefined,
    alternates: { canonical: `/livre/${slug}` },
    openGraph: {
      title: book.title,
      description: book.description ?? undefined,
      type: "book",
      url: `${SITE_URL}/livre/${book.slug}`,
      authors: [book.author],
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description: book.description ?? undefined,
      images: [image],
    },
  };
}

const LANG_LABELS: Record<string, string> = { fr: "Français", en: "English", ar: "العربية" };

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const bookMediaType = book.mediaType === "AUDIO" ? "AUDIO" : "PDF";
  const genreSlug = book.categories[0]?.category.slug;
  const [hdrs, , relatedBooks, sameAuthorBooks, genreBooks, authorProfile, settings, session] =
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

  const viewerIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
  if (shouldCountView(book.id, viewerIp)) incrementViewCount(book.id).catch(() => {});

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
  const langLabel = LANG_LABELS[book.language] ?? book.language;
  const reportEmail = settings.email || "contact@livrespdfgratuits.com";
  const reportHref = `mailto:${reportEmail}?subject=${encodeURIComponent(
    `Signalement : ${book.title}`
  )}&body=${encodeURIComponent(
    `Bonjour,\n\nJe souhaite signaler ce livre :\n${book.title}\n${SITE_URL}/livre/${book.slug}\n\nMotif du signalement :\n`
  )}`;
  const fmtDuration = (sec?: number | null) => {
    if (!sec || sec <= 0) return "—";
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    inLanguage: book.language,
    url: `${SITE_URL}/livre/${book.slug}`,
    ...(book.description ? { description: book.description } : {}),
    ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
    ...(book.publishedYear ? { datePublished: String(book.publishedYear) } : {}),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.publisher ? { publisher: { "@type": "Organization", name: book.publisher } } : {}),
    ...(book.coverImage
      ? { image: book.coverImage.startsWith("http") ? book.coverImage : `${SITE_URL}${book.coverImage}` }
      : {}),
    ...(book.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: book.rating, reviewCount: book.ratingCount } }
      : {}),
    isAccessibleForFree: true,
    provider: { "@type": "Organization", name: SITE_NAME },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Catalogue", item: `${SITE_URL}/catalogue` },
      ...(primaryCategory
        ? [{ "@type": "ListItem", position: 3, name: primaryCategory.name, item: `${SITE_URL}/catalogue?category=${primaryCategory.slug}` }]
        : []),
      { "@type": "ListItem", position: primaryCategory ? 4 : 3, name: book.title, item: `${SITE_URL}/livre/${book.slug}` },
    ],
  };

  return (
    <div className="ma">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <DesignHeader />

      <main className="page-main">
        <div className="wrap book-page">
          <nav className="breadcrumb" aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link href="/catalogue">Catalogue</Link>
            {primaryCategory && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/catalogue?category=${primaryCategory.slug}`}>{primaryCategory.name}</Link>
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
              <BookCover book={book} />
            </div>
            <div className="book-hero-info">
              <div className="badges">
                {primaryCategory && (
                  <Link className="badge badge-genre" href={`/catalogue?category=${primaryCategory.slug}`}>
                    {primaryCategory.name}
                  </Link>
                )}
                {hasPdf && <span className="badge badge-pdf">PDF</span>}
                {book.epubUrl && <span className="badge badge-pdf">EPUB</span>}
                {hasPdf && <span className="badge badge-read">Lire en ligne</span>}
                {hasAudio && <span className="badge badge-audio-tag">Audio</span>}
              </div>
              <h1 dir="auto">{book.title}</h1>
              <div className="byline">
                <span>de</span>
                <Link
                  className="author"
                  href={book.authorSlug ? `/auteur/${book.authorSlug}` : `/catalogue?q=${encodeURIComponent(book.author)}`}
                  dir="auto"
                >
                  {formatAuthorName(book.author)}
                </Link>
                {book.publishedYear && <span>· {book.publishedYear}</span>}
              </div>
              <dl className="tile-list">
                <div className="tile">
                  <dt>Langue</dt>
                  <dd>{langLabel}</dd>
                </div>
                {hasAudio ? (
                  <div className="tile">
                    <dt>Durée</dt>
                    <dd>{fmtDuration(book.audioDuration)}</dd>
                  </div>
                ) : (
                  <div className="tile">
                    <dt>Pages</dt>
                    <dd>{book.pageCount ?? "—"}</dd>
                  </div>
                )}
                <div className="tile">
                  <dt>Téléchargements</dt>
                  <dd>{book.downloadCount}</dd>
                </div>
              </dl>
              <div className="actions">
                {hasPdf && (
                  <a className="btn btn-primary btn-lg" href={downloadHref}>
                    <Icon d={I.download} /> Télécharger le PDF
                  </a>
                )}
                {hasPdf && (
                  <Link className="btn btn-outline btn-lg" href={readerHref}>
                    <Icon d={I.book} /> Lire en ligne
                  </Link>
                )}
                {hasAudio && (
                  <a className="btn btn-outline btn-lg" href="#ecouter">
                    <Icon d={I.headphones} /> Écouter
                  </a>
                )}
                <FavButton bookId={book.id} title={book.title} initialFavorited={isFavorited} isLoggedIn={isLoggedIn} />
                <ShareButtons url={`${SITE_URL}/livre/${book.slug}`} title={book.title} />
              </div>
            </div>
          </section>

          <div className="detail-layout">
            <div className="detail-main">
              {book.description && (
                <section aria-labelledby="about">
                  <h2 id="about">À propos</h2>
                  <p className="prose" dir="auto">
                    {book.description}
                  </p>
                </section>
              )}

              {hasAudio && (
                <section id="ecouter" aria-labelledby="listen" style={{ scrollMarginTop: 90 }}>
                  <h2 id="listen">Écouter en ligne</h2>
                  <AudioPlayer tracks={audioTracks} totalDuration={book.audioDuration ?? undefined} />
                </section>
              )}

              {authorProfile && (authorProfile.bio || authorProfile.image) && (
                <section aria-labelledby="author">
                  <h2 id="author">L&apos;auteur</h2>
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
                          Voir tous ses livres <Icon d={I.arrow} />
                        </Link>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {sameAuthorBooks.length > 0 && (
                <section aria-labelledby="same-author">
                  <h2 id="same-author">Du même auteur</h2>
                  <div className="mini-grid">
                    {sameAuthorBooks.map((b) => (
                      <BookMini key={b.slug} book={b} />
                    ))}
                  </div>
                </section>
              )}

              {genreBooks.length > 0 && primaryCategory && (
                <section aria-labelledby="genre">
                  <h2 id="genre">Plus de {primaryCategory.name.toLowerCase()}</h2>
                  <div className="mini-grid">
                    {genreBooks.map((b) => (
                      <BookMini key={b.slug} book={b} />
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby="reviews">
                <h2 id="reviews">Avis & notes</h2>
                <Reviews bookId={book.id} isLoggedIn={isLoggedIn} />
              </section>
            </div>

            <aside className="detail-aside" aria-label="Lire ou télécharger">
              <div className="download-card">
                <h2>Lire ou télécharger</h2>
                <div className="notice">
                  <Icon d={I.shield} size={22} />
                  <span>
                    Ce livre est dans le domaine public : vous pouvez le lire, le télécharger et
                    le partager librement.
                  </span>
                </div>

                {hasPdf && (
                  <Link className="btn btn-ink btn-xl" href={readerHref}>
                    <Icon d={I.book} /> Ouvrir le lecteur
                  </Link>
                )}
                {hasAudio && (
                  <a className="btn btn-ink btn-xl" href="#ecouter">
                    <Icon d={I.headphones} /> Écouter en ligne
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
                      <p>Lisible hors ligne sur tous vos appareils.</p>
                      <a className="btn btn-primary btn-xl" href={downloadHref}>
                        <Icon d={I.download} /> Télécharger le PDF
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
                        <span>liseuse / mobile</span>
                      </div>
                      <p>Idéal pour liseuses, Kindle et téléphones.</p>
                      <a className="btn btn-outline btn-xl" href={book.epubUrl} target="_blank" rel="noopener noreferrer">
                        <Icon d={I.download} /> Télécharger l&apos;EPUB
                      </a>
                      <a
                        className="btn btn-outline btn-xl"
                        href="https://www.amazon.com/sendtokindle"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon d={I.external} /> Envoyer vers Kindle
                      </a>
                    </div>
                  </>
                )}

                <p className="small-note">
                  Un souci pour ouvrir le fichier ? <Link href="/contact">Contactez-nous</Link>.
                </p>
                <a className="report" href={reportHref}>
                  <Icon d={I.flag} size={16} /> Signaler ce livre
                </a>{" "}
                <Link className="small-note" href="/dmca">
                  (politique DMCA)
                </Link>
              </div>

              <div className="facts-card">
                <h2>Fiche du livre</h2>
                <dl className="facts">
                  <div>
                    <dt>Titre</dt>
                    <dd dir="auto">{book.title}</dd>
                  </div>
                  <div>
                    <dt>Auteur</dt>
                    <dd dir="auto">{formatAuthorName(book.author)}</dd>
                  </div>
                  {primaryCategory && (
                    <div>
                      <dt>Genre</dt>
                      <dd>{primaryCategory.name}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Langue</dt>
                    <dd>{langLabel}</dd>
                  </div>
                  {book.pageCount && (
                    <div>
                      <dt>Pages</dt>
                      <dd>{book.pageCount}</dd>
                    </div>
                  )}
                  {book.publishedYear && (
                    <div>
                      <dt>Publication</dt>
                      <dd>{book.publishedYear}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Formats</dt>
                    <dd>
                      {[hasPdf && "PDF", book.epubUrl && "EPUB", hasAudio && "Audio"].filter(Boolean).join(" · ") || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Licence</dt>
                    <dd>Domaine public</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>

          {relatedBooks.length > 0 && (
            <div className="like-band" style={{ marginInline: "calc(50% - 50vw)" }}>
              <div className="like-inner">
                <div className="section-head">
                  <h2>Des livres comme celui-ci</h2>
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
      <MobileTabbar />
    </div>
  );
}
