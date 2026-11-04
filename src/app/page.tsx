import Link from "next/link";
import { Search, BookOpen, Users, Download, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/books/book-card";
import {
  getFeaturedBooks,
  getLatestBooks,
  getCategoriesWithCounts,
} from "@/lib/books";
import { getServerI18n } from "@/i18n/server";
import { getSiteSettings } from "@/lib/settings";

export default async function HomePage() {
  const settings = await getSiteSettings();
  const [{ t }, featuredBooks, latestBooks, categories] = await Promise.all([
    getServerI18n(),
    getFeaturedBooks(settings.featuredBooksCount),
    getLatestBooks(6),
    getCategoriesWithCounts(),
  ]);

  const stats = [
    { icon: BookOpen, value: "1,250+", label: t.home.statsBooks },
    { icon: Users, value: "50,000+", label: t.home.statsDownloads },
    { icon: Download, value: "10,000+", label: t.home.statsUsers },
  ];

  const categoryIcons: Record<string, string> = {
    romans: "📚",
    sciences: "🔬",
    histoire: "🏛️",
    informatique: "💻",
    religion: "☪️",
    philosophie: "🎭",
    poesie: "✍️",
    biographies: "👤",
  };

  const categoryData = categories.map((cat) => ({
    ...cat,
    icon: categoryIcons[cat.slug] || "📖",
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 animate-fade-in">
                {settings.heroTitle ? (
                  settings.heroTitle
                ) : (
                  <>
                    {t.home.heroTitle}{' '}
                    <span className="text-amber-500">{t.home.heroHighlight}</span>
                  </>
                )}
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 mb-8 animate-fade-in stagger-1">
                {settings.heroSubtitle || t.home.heroSubtitle}
              </p>
              
              <form className="max-w-xl mx-auto mb-8 animate-fade-in stagger-2" action="/catalogue" method="GET">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    name="q"
                    placeholder={t.search.placeholder}
                    className="w-full h-14 pl-12 pr-4 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600"
                  >
                    {t.search.button}
                  </Button>
                </div>
              </form>

              <div className="flex justify-center gap-8 lg:gap-16 animate-fade-in stagger-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <div className="text-2xl lg:text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {t.home.categoriesTitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {t.home.categoriesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryData.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categorie/${category.slug}`}
                  className="group p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {category.count} {t.home.booksSuffix}
                  </p>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/catalogue">
                <Button variant="outline" size="lg">
                  {t.home.allCategories}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {t.home.featuredTitle}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {t.home.featuredSubtitle}
                </p>
              </div>
              <Link href="/catalogue?sort=popular">
                <Button variant="ghost">
                  {t.home.seeAll}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {t.home.newestTitle}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {t.home.newestSubtitle}
                </p>
              </div>
              <Link href="/catalogue?sort=newest">
                <Button variant="ghost">
                  {t.home.seeAll}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {latestBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t.home.authorTitle}
            </h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              {t.home.authorText}
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
                {t.home.authorCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
