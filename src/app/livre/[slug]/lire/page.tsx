import { notFound } from "next/navigation";
import { getBookBySlug } from "@/lib/books";
import { ReaderClient } from "@/components/books/reader-client";
import { getServerI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [book, { t }] = await Promise.all([getBookBySlug(slug), getServerI18n()]);
  return {
    title: book ? fmt(t.meta.readTitle, { title: book.title }) : t.reader.opening,
    robots: { index: false, follow: true }, // page de lecture : pas indexée
  };
}

export default async function ReadPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book || !book.isPublished || !book.pdfUrl) notFound();

  // Le lecteur charge toujours via le proxy même origine (/livre/[slug]/pdf) :
  // indispensable pour les PDF hébergés sur archive.org (pas de CORS).
  return <ReaderClient pdfUrl={`/livre/${slug}/pdf`} title={book.title} slug={slug} />;
}
