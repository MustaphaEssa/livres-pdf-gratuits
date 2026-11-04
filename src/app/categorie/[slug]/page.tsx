import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/books/book-card";
import { Pagination } from "@/components/books/pagination";
import { searchBooks } from "@/lib/books";
import prisma from "@/lib/db";
import { SITE_NAME } from "@/lib/site";
import { getServerI18n } from "@/i18n/server";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({
    where: { type: "BOOK" },
    select: { slug: true },
  });
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Catégorie introuvable" };
  return {
    title: `Livres ${category.name} gratuits en PDF`,
    description:
      category.description ||
      `Téléchargez gratuitement des livres de la catégorie ${category.name} au format PDF sur ${SITE_NAME}.`,
    alternates: { canonical: `/categorie/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const [{ books, total, totalPages }, { t }] = await Promise.all([
    searchBooks({ category: slug, page, sort: "popular" }),
    getServerI18n(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-500">{t.nav.home}</Link>
            <span>/</span>
            <Link href="/catalogue" className="hover:text-amber-500">{t.nav.catalogue}</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">{category.name}</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {category.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {total} {t.catalogue.booksWord} {t.catalogue.freePdf}
              {category.description ? ` — ${category.description}` : ""}
            </p>
          </div>

          {books.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500 mb-4">{t.catalogue.noResults}</p>
              <Link href="/catalogue">
                <Button>{t.catalogue.seeAllBooks}</Button>
              </Link>
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            makeHref={(p) =>
              p === 1 ? `/categorie/${slug}` : `/categorie/${slug}?page=${p}`
            }
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
