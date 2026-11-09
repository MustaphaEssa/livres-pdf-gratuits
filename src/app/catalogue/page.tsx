import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import CatalogueClient, { type CatBook } from "@/components/design/catalogue-client";
import { getCategoriesWithCounts } from "@/lib/books";
import prisma from "@/lib/db";

export const metadata = {
  title: "Catalogue",
  description:
    "Parcourez des milliers de livres gratuits du domaine public : romans, histoire, poésie, philosophie… À lire en ligne, en PDF, EPUB ou en audio.",
  alternates: { canonical: "/catalogue" },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CataloguePage({ searchParams }: Props) {
  const sp = await searchParams;

  const [books, categories] = await Promise.all([
    prisma.book.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        title: true,
        author: true,
        coverImage: true,
        language: true,
        mediaType: true,
        audioSourceId: true,
        categories: { select: { category: { select: { name: true, slug: true } } } },
      },
      orderBy: { downloadCount: "desc" },
    }),
    getCategoriesWithCounts(),
  ]);

  const catNames = categories.map((c) => c.name);
  const catSlug = one(sp.category) || one(sp.cat);
  const initialCatName = categories.find((c) => c.slug === catSlug)?.name;
  const lang = one(sp.language) || one(sp.lang);

  return (
    <div className="ma">
      <DesignHeader />
      <main className="page-main">
        <CatalogueClient
          books={books as CatBook[]}
          categories={catNames}
          initial={{
            q: one(sp.q),
            cats: initialCatName ? [initialCatName] : [],
            langs: ["fr", "en", "ar"].includes(lang) ? [lang] : [],
            audio: one(sp.audio) === "1",
          }}
        />
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
