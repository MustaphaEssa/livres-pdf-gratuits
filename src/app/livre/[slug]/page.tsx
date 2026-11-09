import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Download,
  Star,
  Calendar,
  FileText,
  User,
  Globe,
  Eye,
  Headphones,
  Clock,
  BookOpen,
  Send,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { PdfReader } from "@/components/books/pdf-reader";
import { AudioPlayer } from "@/components/books/audio-player";
import { FavoriteButton } from "@/components/books/favorite-button";
import { ShareButtons } from "@/components/books/share-buttons";
import { Reviews } from "@/components/books/reviews";
import { BookCard } from "@/components/books/book-card";
import { formatFileSize, formatAuthorName } from "@/lib/utils";
import { getBookBySlug, getRelatedBooks, getSameAuthorBooks, getBooksByGenre, getAuthorProfile, incrementViewCount, parseAudioTracks } from "@/lib/books";
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

  if (!book) {
    return { title: "Livre non trouvé" };
  }

  const image = book.coverImage
    ? book.coverImage.startsWith("http")
      ? book.coverImage
      : `${SITE_URL}${book.coverImage}`
    : `${SITE_URL}/og-image.png`;

  return {
    title: book.title,
    description: book.description ?? undefined,
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

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  // Requêtes indépendantes lancées en parallèle (en-têtes, i18n, similaires, session)
  const bookMediaType = book.mediaType === "AUDIO" ? "AUDIO" : "PDF";
  const genreSlug = book.categories[0]?.category.slug;
  const [hdrs, { t }, relatedBooks, sameAuthorBooks, genreBooks, authorProfile, settings, session] =
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

  // Comptabilise une vue, en évitant les rechargements répétés d'une même IP
  const viewerIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  if (shouldCountView(book.id, viewerIp)) {
    incrementViewCount(book.id).catch(() => {});
  }

  // État connecté / favori (pour les boutons)
  const isLoggedIn = !!session;
  let isFavorited = false;
  if (session) {
    isFavorited = !!(await prisma.favorite.findUnique({
      where: { userId_bookId: { userId: session.sub, bookId: book.id } },
    }));
  }

  const languageNames: Record<string, string> = {
    fr: t.langNames.fr,
    ar: t.langNames.ar,
    en: t.langNames.en,
  };

  const primaryCategory = book.categories[0]?.category;
  const downloadHref = `/livre/${book.slug}/telecharger`;

  const audioTracks = parseAudioTracks(book.audioTracks);
  const hasAudio = audioTracks.length > 0;
  const hasPdf = !!book.pdfUrl;
  // « Livre audio » au sens fiche : audio uniquement (pas de PDF).
  const isAudio = !hasPdf && (book.mediaType === "AUDIO" || hasAudio);
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

  // Données structurées pour les moteurs de recherche (rich results)
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
    ...(book.publisher
      ? { publisher: { "@type": "Organization", name: book.publisher } }
      : {}),
    ...(book.coverImage
      ? {
          image: book.coverImage.startsWith("http")
            ? book.coverImage
            : `${SITE_URL}${book.coverImage}`,
        }
      : {}),
    ...(book.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: book.rating,
            reviewCount: book.ratingCount,
          },
        }
      : {}),
    workExample: {
      "@type": "Book",
      bookFormat: "https://schema.org/EBook",
      potentialAction: {
        "@type": "ReadAction",
        target: `${SITE_URL}${downloadHref}`,
      },
    },
    isAccessibleForFree: true,
    provider: { "@type": "Organization", name: SITE_NAME },
  };

  // Fil d'Ariane pour les moteurs de recherche (BreadcrumbList)
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Catalogue", item: `${SITE_URL}/catalogue` },
      ...(primaryCategory
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: primaryCategory.name,
              item: `${SITE_URL}/catalogue?category=${primaryCategory.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: primaryCategory ? 4 : 3,
        name: book.title,
        item: `${SITE_URL}/livre/${book.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-500">
              Accueil
            </Link>
            <span>/</span>
            <Link href="/catalogue" className="hover:text-amber-500">
              Catalogue
            </Link>
            {primaryCategory && (
              <>
                <span>/</span>
                <Link
                  href={`/catalogue?category=${primaryCategory.slug}`}
                  className="hover:text-amber-500"
                >
                  {primaryCategory.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-slate-900 dark:text-white">{book.title}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Cover & Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {/* Cover Image */}
                <div className="relative aspect-[2/3] bg-white rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 mb-6">
                  {book.coverImage ? (
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                      <span className="text-6xl font-bold text-slate-300 dark:text-slate-600">
                        {book.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    Gratuit
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {isAudio ? (
                    <a href="#lecture" className="block">
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 h-12 text-lg">
                        <Headphones className="mr-2 h-5 w-5" />
                        Écouter le livre audio
                      </Button>
                    </a>
                  ) : (
                    <>
                      <a href={downloadHref} className="block">
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 h-12 text-lg">
                          <Download className="mr-2 h-5 w-5" />
                          {t.bookPage.downloadPdf}
                        </Button>
                      </a>
                      <a href="#lecture" className="block">
                        <Button variant="outline" className="w-full h-12">
                          <Eye className="mr-2 h-5 w-5" />
                          {t.bookPage.readOnline}
                        </Button>
                      </a>
                      {hasAudio && (
                        <a href="#ecouter" className="block">
                          <Button variant="outline" className="w-full h-12">
                            <Headphones className="mr-2 h-5 w-5" />
                            Écouter l&apos;audio
                          </Button>
                        </a>
                      )}
                      {book.epubUrl && (
                        <>
                          <a
                            href={book.epubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <Button variant="outline" className="w-full h-12">
                              <BookOpen className="mr-2 h-5 w-5" />
                              Télécharger l&apos;EPUB
                            </Button>
                          </a>
                          <a
                            href="https://www.amazon.com/sendtokindle"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                            title="Envoyez le fichier EPUB vers votre Kindle"
                          >
                            <Button variant="outline" className="w-full h-12">
                              <Send className="mr-2 h-5 w-5" />
                              Envoyer vers Kindle
                            </Button>
                          </a>
                        </>
                      )}
                    </>
                  )}
                  <div className="flex gap-2">
                    <FavoriteButton
                      bookId={book.id}
                      initialFavorited={isFavorited}
                      isLoggedIn={isLoggedIn}
                      addLabel={t.bookPage.addFavorite}
                      removeLabel={t.bookPage.removeFavorite}
                    />
                    <ShareButtons
                      url={`${SITE_URL}/livre/${book.slug}`}
                      title={book.title}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Book Details */}
            <div className="lg:col-span-2">
              {/* Category */}
              {primaryCategory && (
                <Link
                  href={`/catalogue?category=${primaryCategory.slug}`}
                  className="inline-block px-3 py-1 text-sm bg-slate-800 text-white rounded mb-4 hover:bg-amber-500 transition-colors"
                >
                  {primaryCategory.name}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                {book.title}
              </h1>

              {/* Formats disponibles */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {hasPdf && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 text-xs font-medium">
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </span>
                )}
                {book.epubUrl && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 text-xs font-medium">
                    <BookOpen className="h-3.5 w-3.5" /> EPUB
                  </span>
                )}
                {hasAudio && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2.5 py-1 text-xs font-medium">
                    <Headphones className="h-3.5 w-3.5" /> Audio
                  </span>
                )}
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 text-lg text-slate-600 dark:text-slate-400 mb-6">
                <User className="h-5 w-5" />
                <span>
                  par{" "}
                  {book.authorSlug ? (
                    <Link
                      href={`/auteur/${book.authorSlug}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-amber-500 hover:underline"
                    >
                      {formatAuthorName(book.author)}
                    </Link>
                  ) : (
                    <strong className="text-slate-900 dark:text-white">{formatAuthorName(book.author)}</strong>
                  )}
                </span>
              </div>

              {/* Rating */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(book.rating)
                          ? "fill-amber-500 text-amber-500"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                    {book.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-slate-500">
                  ({book.ratingCount} {t.bookPage.reviewsCount})
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {book.downloadCount} {t.bookPage.downloadsCount}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  isAudio
                    ? { icon: Headphones, value: "Audio", label: "Format" }
                    : {
                        icon: FileText,
                        value: book.pdfSize ? formatFileSize(book.pdfSize) : "—",
                        label: t.bookPage.size,
                      },
                  isAudio
                    ? { icon: Clock, value: fmtDuration(book.audioDuration), label: "Durée" }
                    : {
                        icon: FileText,
                        value: book.pageCount ?? "—",
                        label: t.bookPage.pages,
                      },
                  {
                    icon: Globe,
                    value: languageNames[book.language] ?? book.language,
                    label: t.bookPage.language,
                  },
                  {
                    icon: Calendar,
                    value: book.publishedYear ?? "—",
                    label: t.bookPage.year,
                  },
                ].map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <Icon className="h-5 w-5 text-amber-500" />
                    <div className="text-base font-semibold text-slate-900 dark:text-white">
                      {value}
                    </div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {book.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t.bookPage.description}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Book Info */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {t.bookPage.information}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">{t.bookPage.publisher}:</span>
                    <span className="ml-2 text-slate-900 dark:text-white">
                      {book.publisher ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.bookPage.isbn}:</span>
                    <span className="ml-2 text-slate-900 dark:text-white">
                      {book.isbn ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.bookPage.pubYear}:</span>
                    <span className="ml-2 text-slate-900 dark:text-white">
                      {book.publishedYear ?? "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t.bookPage.language}:</span>
                    <span className="ml-2 text-slate-900 dark:text-white">
                      {languageNames[book.language] ?? book.language}
                    </span>
                  </div>
                </div>
              </div>

              {/* Domaine public */}
              <div className="mb-8 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10 p-4">
                <svg className="h-5 w-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800 dark:text-green-300">
                  <strong>Œuvre du domaine public</strong> — ce livre est libre de droits et peut
                  être lu, téléchargé et partagé gratuitement. Source : Internet Archive.{" "}
                  <a href={reportHref} className="underline hover:text-green-900 dark:hover:text-green-200">
                    Signaler ce livre
                  </a>{" "}
                  (<Link href="/dmca" className="underline hover:text-green-900 dark:hover:text-green-200">politique DMCA</Link>).
                </p>
              </div>

              {/* Lecture en ligne (PDF) */}
              {hasPdf && (
                <div id="lecture" className="scroll-mt-24">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {t.bookPage.readOnline}
                  </h2>
                  <PdfReader
                    pdfUrl={book.pdfUrl as string}
                    title={book.title}
                    ctaLabel={t.bookPage.readerCta}
                    buttonLabel={t.bookPage.readerButton}
                  />
                </div>
              )}

              {/* Écoute en ligne (audio) */}
              {hasAudio && (
                <div id="ecouter" className={`scroll-mt-24 ${hasPdf ? "mt-10" : ""}`}>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    Écouter en ligne
                  </h2>
                  <AudioPlayer
                    tracks={audioTracks}
                    totalDuration={book.audioDuration ?? undefined}
                  />
                </div>
              )}

              {!hasPdf && !hasAudio && (
                <p className="text-slate-500">{t.bookPage.noPdf}</p>
              )}

              {/* Avis & notes */}
              <div className="mt-10">
                <Reviews bookId={book.id} isLoggedIn={isLoggedIn} />
              </div>
            </div>
          </div>

          {/* À propos de l'auteur */}
          {authorProfile && (authorProfile.bio || authorProfile.image) && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                À propos de l&apos;auteur
              </h2>
              <div className="flex flex-col sm:flex-row gap-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
                {authorProfile.image && (
                  <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 mx-auto sm:mx-0">
                    <Image
                      src={authorProfile.image}
                      alt={authorProfile.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {authorProfile.name}
                    </h3>
                    {(authorProfile.birthYear || authorProfile.deathYear) && (
                      <span className="text-sm text-slate-400">
                        ({authorProfile.birthYear ?? "?"}
                        {authorProfile.deathYear ? ` – ${authorProfile.deathYear}` : ""})
                      </span>
                    )}
                  </div>
                  {authorProfile.bio && (
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-5">
                      {authorProfile.bio}
                    </p>
                  )}
                  {book.authorSlug && (
                    <Link
                      href={`/auteur/${book.authorSlug}`}
                      className="inline-block mt-3 text-sm text-amber-600 hover:underline"
                    >
                      Voir tous ses livres →
                    </Link>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Du même auteur */}
          {sameAuthorBooks.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isAudio ? "Autres livres audio du même auteur" : "Du même auteur"}
                </h2>
                {book.authorSlug && (
                  <Link
                    href={`/auteur/${book.authorSlug}`}
                    className="text-sm text-amber-600 hover:underline"
                  >
                    Voir tout
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {sameAuthorBooks.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          )}

          {/* Plus de ce genre */}
          {genreBooks.length > 0 && primaryCategory && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Plus de {primaryCategory.name.toLowerCase()}
                </h2>
                <Link
                  href={`/catalogue?category=${primaryCategory.slug}`}
                  className="text-sm text-amber-600 hover:underline"
                >
                  Voir tout
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {genreBooks.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          )}

          {/* Livres similaires */}
          {relatedBooks.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {t.bookPage.relatedTitle}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedBooks.map((related) => (
                  <BookCard key={related.id} book={related} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
