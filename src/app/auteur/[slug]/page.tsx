import Link from "next/link";
import { notFound } from "next/navigation";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCard from "@/components/design/book-card";
import Icon, { I } from "@/components/design/icon";
import { getBooksByAuthorSlug, getCategoriesWithCounts } from "@/lib/books";
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
    alternates: { canonical: `/auteur/${slug}` },
  };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ books, total, totalPages, authorName }, categories] = await Promise.all([
    getBooksByAuthorSlug(slug, page),
    getCategoriesWithCounts(),
  ]);
  if (!authorName || total === 0) notFound();

  const author = await getAuthorInfo(slug, authorName);

  return (
    <div className="ma">
      <DesignHeader />
      <main className="page-main">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Fil d'Ariane" style={{ paddingTop: 16 }}>
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link href="/auteurs">Auteurs</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{author.name}</span>
          </nav>

          <div className="page-head">
            <div className="author-card" style={{ borderRadius: 24 }}>
              {author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="avatar"
                  src={author.image}
                  alt={author.name}
                  style={{ width: 96, height: 96, objectFit: "cover" }}
                />
              ) : (
                <span className="avatar" aria-hidden="true" style={{ width: 96, height: 96, fontSize: 40 }}>
                  {[...author.name][0]}
                </span>
              )}
              <div>
                <h1 style={{ fontSize: 34 }}>{author.name}</h1>
                {(author.birthYear || author.deathYear) && (
                  <p style={{ color: "var(--muted)", fontSize: 15 }}>
                    {author.birthYear ?? "?"} – {author.deathYear ?? "?"}
                  </p>
                )}
                <p style={{ color: "var(--muted)", margin: "4px 0 8px" }}>
                  {total} livre{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
                </p>
                {author.bio && <p>{author.bio}</p>}
              </div>
            </div>
          </div>

          <div className="grid-books">
            {books.map((b) => (
              <BookCard key={b.slug} book={b} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="load-more" style={{ gap: 12 }}>
              {page > 1 && (
                <Link className="btn btn-outline" href={`/auteur/${slug}${page - 1 === 1 ? "" : `?page=${page - 1}`}`}>
                  <Icon d={I.arrow} /> Précédent
                </Link>
              )}
              <span style={{ alignSelf: "center", color: "var(--muted)" }}>
                Page {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link className="btn btn-outline" href={`/auteur/${slug}?page=${page + 1}`}>
                  Suivant <Icon d={I.arrow} />
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
