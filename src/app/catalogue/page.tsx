import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import CatalogueClient, { type CatBook } from "@/components/design/catalogue-client";
import { getCategoriesWithCounts } from "@/lib/books";
import prisma from "@/lib/db";
import JsonLd, { breadcrumbLd } from "@/components/seo/json-ld";
import { isLangCode } from "@/lib/languages";
import { getServerI18n } from "@/i18n/server";
import { i18nAlternates } from "@/i18n/seo";

export async function generateMetadata() {
  const { locale, t } = await getServerI18n();
  return {
    title: t.meta.catalogueTitle,
    description: t.meta.catalogueDesc,
    alternates: i18nAlternates(locale, "/catalogue"),
  };
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CataloguePage({ searchParams }: Props) {
  const sp = await searchParams;
  const { locale, t } = await getServerI18n();

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

  const catList = categories.map((c) => ({ name: c.name, slug: c.slug }));
  const catSlug = one(sp.category) || one(sp.cat);
  const initialCatName = categories.find((c) => c.slug === catSlug)?.name;
  const lang = one(sp.language) || one(sp.lang);

  return (
    <div className="ma">
      <JsonLd
        data={breadcrumbLd([
          { name: t.nav.home, url: "/" },
          { name: t.nav.catalogue, url: "/catalogue" },
        ], locale)}
      />
      <DesignHeader />
      <main className="page-main" id="contenu">
        <CatalogueClient
          books={books as CatBook[]}
          categories={catList}
          initial={{
            q: one(sp.q),
            cats: initialCatName ? [initialCatName] : [],
            langs: isLangCode(lang) ? [lang] : [],
            audio: one(sp.audio) === "1",
          }}
        />
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
