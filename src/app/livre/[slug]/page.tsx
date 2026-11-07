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
  Share2,
  Eye,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PdfReader } from "@/components/books/pdf-reader";
import { FavoriteButton } from "@/components/books/favorite-button";
import { Reviews } from "@/components/books/reviews";
import { BookCard } from "@/components/books/book-card";
import { formatFileSize, formatAuthorName } from "@/lib/utils";
import { getBookBySlug, getRelatedBooks, getSameAuthorBooks, incrementViewCount } from "@/lib/books";
import { getUserSession } from "@/lib/user-server";
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
  const [hdrs, { t }, relatedBooks, sameAuthorBooks, session] = await Promise.all([
    headers(),
    getServerI18n(),
    getRelatedBooks(book.id, book.categories.map((c) => c.categoryId), 4),
    getSameAuthorBooks(book.id, book.authorSlug, 4),
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

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
                <div className="relative aspect-[2/3] bg-white rounded-lg overflow-hidden shadow-lg mb-6">
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
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
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
                  <div className="flex gap-2">
                    <FavoriteButton
                      bookId={book.id}
                      initialFavorited={isFavorited}
                      isLoggedIn={isLoggedIn}
                      addLabel={t.bookPage.addFavorite}
                      removeLabel={t.bookPage.removeFavorite}
                    />
                    <Button variant="outline" size="icon" className="flex-1">
                      <Share2 className="h-5 w-5" />
                    </Button>
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
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {book.title}
              </h1>

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {book.pdfSize ? formatFileSize(book.pdfSize) : "—"}
                    </div>
                    <div className="text-xs text-slate-500">{t.bookPage.size}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {book.pageCount ?? "—"}
                    </div>
                    <div className="text-xs text-slate-500">{t.bookPage.pages}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Globe className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {languageNames[book.language] ?? book.language}
                    </div>
                    <div className="text-xs text-slate-500">{t.bookPage.language}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {book.publishedYear ?? "—"}
                    </div>
                    <div className="text-xs text-slate-500">{t.bookPage.year}</div>
                  </CardContent>
                </Card>
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
                  être lu, téléchargé et partagé gratuitement. Source : Internet Archive.
                </p>
              </div>

              {/* Lecture en ligne */}
              <div id="lecture" className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {t.bookPage.readOnline}
                </h2>
                {book.pdfUrl ? (
                  <PdfReader
                    pdfUrl={book.pdfUrl}
                    title={book.title}
                    ctaLabel={t.bookPage.readerCta}
                    buttonLabel={t.bookPage.readerButton}
                  />
                ) : (
                  <p className="text-slate-500">{t.bookPage.noPdf}</p>
                )}
              </div>

              {/* Avis & notes */}
              <div className="mt-10">
                <Reviews bookId={book.id} isLoggedIn={isLoggedIn} />
              </div>
            </div>
          </div>

          {/* Du même auteur */}
          {sameAuthorBooks.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Du même auteur
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
