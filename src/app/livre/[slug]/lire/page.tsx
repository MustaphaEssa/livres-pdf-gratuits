import { notFound } from "next/navigation";
import { getBookBySlug } from "@/lib/books";
import { ReaderClient } from "@/components/books/reader-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  return {
    title: book ? `Lire : ${book.title}` : "Lecture",
    robots: { index: false, follow: true }, // page de lecture : pas indexée
  };
}

export default async function ReadPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book || !book.isPublished || !book.pdfUrl) notFound();

  return <ReaderClient pdfUrl={book.pdfUrl} title={book.title} slug={slug} />;
}
