import Link from "next/link";
import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookCard } from "@/components/books/book-card";
import { Pagination } from "@/components/books/pagination";
import { getBooksByAuthorSlug } from "@/lib/books";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params;
  const { authorName, total } = await getBooksByAuthorSlug(slug, 1);
  if (!authorName) return { title: "Auteur introuvable" };
  return {
    title: `${authorName} — ${total} livre(s)`,
    description: `Tous les livres de ${authorName} disponibles gratuitement en PDF.`,
  };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { books, total, totalPages, authorName } = await getBooksByAuthorSlug(slug, page);

  if (!authorName || total === 0) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          {/* Fil d'ariane */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <Link href="/" className="hover:text-amber-500">Accueil</Link>
            <span>/</span>
            <Link href="/auteurs" className="hover:text-amber-500">Auteurs</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">{authorName}</span>
          </nav>

          {/* En-tête auteur */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <User className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{authorName}</h1>
              <p className="text-slate-600 dark:text-slate-400">
                {total} livre{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Grille de livres */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            makeHref={(p) => `/auteur/${slug}${p === 1 ? "" : `?page=${p}`}`}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
