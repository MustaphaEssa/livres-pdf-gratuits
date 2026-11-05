import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getAuthorsWithCounts } from "@/lib/books";

export const metadata = {
  title: "Auteurs",
  description: "Parcourez tous les auteurs et découvrez leurs livres gratuits en PDF.",
};

export default async function AuthorsPage() {
  const authors = await getAuthorsWithCounts();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Auteurs</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {authors.length} auteur{authors.length > 1 ? "s" : ""} dans la bibliothèque
            </p>
          </div>

          {authors.length === 0 ? (
            <p className="text-slate-500">Aucun auteur pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {authors.map((a) => (
                <Link
                  key={a.slug}
                  href={`/auteur/${a.slug}`}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    {a.image ? (
                      <Image src={a.image} alt={a.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white truncate">{a.name}</div>
                    <div className="text-sm text-slate-500">
                      {a.count} livre{a.count > 1 ? "s" : ""}
                    </div>
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
