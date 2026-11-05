import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BookCard } from "@/components/books/book-card";
import { Pagination } from "@/components/books/pagination";
import { getBooksByAuthorSlug } from "@/lib/books";
import { getAuthorInfo, formatAuthorName } from "@/lib/authors";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { slug } = await params;
  const { authorName, total } = await getBooksByAuthorSlug(slug, 1);
  if (!authorName) return { title: "Auteur introuvable" };
  const name = formatAuthorName(authorName);
  return {
    title: `${name} — ${total} livre(s)`,
    description: `Tous les livres de ${name} disponibles gratuitement en PDF.`,
  };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { books, total, totalPages, authorName } = await getBooksByAuthorSlug(slug, page);

  if (!authorName || total === 0) notFound();

  const author = await getAuthorInfo(slug, authorName);

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
            <span className="text-slate-900 dark:text-white">{author.name}</span>
          </nav>

          {/* En-tête auteur (photo + bio Wikipédia) */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="w-28 h-28 shrink-0 rounded-full overflow-hidden bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              {author.image ? (
                <Image
                  src={author.image}
                  alt={author.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{author.name}</h1>
              {(author.birthYear || author.deathYear) && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {author.birthYear ?? "?"} – {author.deathYear ?? "?"}
                </p>
              )}
              <p className="text-slate-600 dark:text-slate-400 mt-1 mb-3">
                {total} livre{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
              </p>
              {author.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl line-clamp-5">
                  {author.bio}
                  <span className="text-slate-400"> — source : Wikipédia</span>
                </p>
              )}
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
