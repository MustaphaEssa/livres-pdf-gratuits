import Link from "next/link";
import Image from "next/image";
import { Library, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getPublishedCollections } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Collections de livres",
  description:
    "Des sélections thématiques de livres gratuits : classiques à lire en un week-end, romans d'aventure, et plus. Choisies pour vous.",
  alternates: { canonical: "/collections" },
  openGraph: {
    title: "Collections de livres gratuits",
    description: "Des sélections thématiques de livres gratuits, choisies pour vous.",
    type: "website",
    url: `${SITE_URL}/collections`,
  },
};

export default async function CollectionsPage() {
  const collections = await getPublishedCollections();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-amber-500 font-medium mb-2">
              <Library className="h-5 w-5" /> Collections
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Collections de livres
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Des sélections thématiques, réunies autour d&apos;une idée, pour trouver
              votre prochaine lecture.
            </p>
          </div>

          {collections.length === 0 ? (
            <div className="text-center py-16">
              <Library className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">Aucune collection pour le moment.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.slug}`}
                  className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-800">
                    {c.coverImage ? (
                      <Image src={c.coverImage} alt={c.title} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Library className="h-10 w-10 text-amber-400/70" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors mb-1">
                      {c.title}
                    </h2>
                    {c.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {c.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <BookOpen className="h-3.5 w-3.5" /> {c._count.books} livre(s)
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
