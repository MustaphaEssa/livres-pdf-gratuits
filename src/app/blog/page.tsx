import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { getPublishedPosts } from "@/lib/posts";
import { getServerI18n } from "@/i18n/server";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Blog",
  description:
    "Actualités, conseils et réflexions sur le monde du livre et de la lecture.",
};

export default async function BlogPage() {
  const [posts, { t }] = await Promise.all([
    getPublishedPosts(),
    getServerI18n(),
  ]);
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t.blog.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t.blog.subtitle}
            </p>
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-slate-500">{t.blog.empty}</p>
          ) : (
            <>
              {/* Article à la une */}
              {featured && (
                <div className="mb-12">
                  <Card className="overflow-hidden">
                    <div className="grid md:grid-cols-2">
                      <div className="relative aspect-video md:aspect-auto bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                        {featured.coverImage && (
                          <Image
                            src={featured.coverImage}
                            alt={featured.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="p-8 flex flex-col justify-center">
                        {featured.categories[0] && (
                          <span className="text-sm text-amber-500 font-medium mb-2">
                            {featured.categories[0].category.name}
                          </span>
                        )}
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                          <Link
                            href={`/blog/${featured.slug}`}
                            className="hover:text-amber-500 transition-colors"
                          >
                            {featured.title}
                          </Link>
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          {featured.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {featured.author && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {featured.author}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(featured.publishedAt ?? featured.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              )}

              {/* Grille d'articles */}
              {rest.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post) => (
                    <Card
                      key={post.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                        {post.coverImage && (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="p-6">
                        {post.categories[0] && (
                          <span className="text-sm text-amber-500 font-medium">
                            {post.categories[0].category.name}
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-2 mb-3">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="hover:text-amber-500 transition-colors"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          {post.author && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {post.author}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.publishedAt ?? post.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
