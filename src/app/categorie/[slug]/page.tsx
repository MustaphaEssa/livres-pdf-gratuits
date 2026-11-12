import Link from "next/link";
import { notFound } from "next/navigation";
import DesignShell from "@/components/design/shell";
import BookCard from "@/components/design/book-card";
import Icon, { I } from "@/components/design/icon";
import { searchBooks } from "@/lib/books";
import prisma from "@/lib/db";
import { SITE_NAME } from "@/lib/site";
import JsonLd, { breadcrumbLd, itemListLd } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const cats = await prisma.category.findMany({ where: { type: "BOOK" }, select: { slug: true } });
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

  const { books, total, totalPages } = await searchBooks({ category: slug, page, sort: "popular" });

  return (
    <DesignShell>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", url: "/" },
            { name: "Catalogue", url: "/catalogue" },
            { name: category.name, url: `/categorie/${slug}` },
          ]),
          ...(books.length > 0 ? [itemListLd(books, `Livres ${category.name}`)] : []),
        ]}
      />
      <div className="wrap">
        <nav className="breadcrumb" aria-label="Fil d'Ariane" style={{ paddingTop: 16 }}>
          <Link href="/">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalogue">Catalogue</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{category.name}</span>
        </nav>
        <div className="page-head">
          <div>
            <h1>{category.name}</h1>
            <p>
              {total} livre{total > 1 ? "s" : ""} gratuit{total > 1 ? "s" : ""} en PDF
              {category.description ? ` — ${category.description}` : ""}
            </p>
          </div>
        </div>

        {books.length > 0 ? (
          <div className="grid-books">
            {books.map((b) => (
              <BookCard key={b.slug} book={b} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Aucun livre dans cette catégorie</h3>
            <Link href="/catalogue" className="btn btn-primary">
              Voir tout le catalogue
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="load-more" style={{ gap: 12 }}>
            {page > 1 && (
              <Link className="btn btn-outline" href={page - 1 === 1 ? `/categorie/${slug}` : `/categorie/${slug}?page=${page - 1}`}>
                <Icon d={I.arrow} /> Précédent
              </Link>
            )}
            <span style={{ alignSelf: "center", color: "var(--muted)" }}>
              Page {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link className="btn btn-outline" href={`/categorie/${slug}?page=${page + 1}`}>
                Suivant <Icon d={I.arrow} />
              </Link>
            )}
          </div>
        )}
      </div>
    </DesignShell>
  );
}
