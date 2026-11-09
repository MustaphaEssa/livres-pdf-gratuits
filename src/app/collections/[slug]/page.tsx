import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, Library } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookCard } from "@/components/books/book-card";
import { getPublishedCollectionBySlug } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const col = await getPublishedCollectionBySlug(slug);
  if (!col) return { title: "Collection introuvable" };
  return {
    title: col.title,
    description: col.description || `Une sélection de ${col.books.length} livres gratuits.`,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: col.title,
      description: col.description || undefined,
      type: "website",
      url: `${SITE_URL}/collections/${slug}`,
      ...(col.coverImage ? { images: [{ url: col.coverImage }] } : {}),
    },
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const col = await getPublishedCollectionBySlug(slug);
  if (!col) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-500 mb-6"
          >
            <ChevronLeft className="h-4 w-4" /> Toutes les collections
          </Link>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 text-amber-500 font-medium mb-2">
              <Library className="h-5 w-5" /> Collection
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              {col.title}
            </h1>
            {col.description && (
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                {col.description}
              </p>
            )}
            <p className="text-sm text-slate-400 mt-2">{col.books.length} livre(s)</p>
          </div>

          {col.coverImage && (
            <div className="relative aspect-[21/9] rounded-xl overflow-hidden mb-10 bg-slate-100 dark:bg-slate-800">
              <Image src={col.coverImage} alt={col.title} fill className="object-cover" />
            </div>
          )}

          <div className="space-y-10">
            {col.books.map((entry) => (
              <div
                key={entry.bookId}
                className="grid sm:grid-cols-[180px_1fr] gap-5 items-start"
              >
                <div className="max-w-[180px]">
                  <BookCard book={entry.book} />
                </div>
                {entry.note && (
                  <div className="sm:pt-2">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-amber-400 pl-4">
                      {entry.note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
