import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { formatDateLocale } from "@/i18n/format";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import { getPublishedPosts, blogLanguageFor } from "@/lib/posts";
import { getCategoriesWithCounts } from "@/lib/books";
import { permanentRedirect } from "next/navigation";
import { localizePath, type Locale } from "@/i18n/config";
import { BLOG_LOCALES } from "@/i18n/seo";

export async function generateMetadata() {
  const { locale, t } = await getServerI18n();
  // Indexée dans les langues qui ont leurs propres articles (les autres redirigent, voir plus bas)
  return pageMetadata({
    locale,
    path: "/blog",
    title: t.meta.blogTitle,
    description: t.meta.blogDesc,
    indexLocales: BLOG_LOCALES,
  });
}

export default async function BlogPage() {
  const { locale, t } = await getServerI18n();
  const lang = await blogLanguageFor(locale);
  // Pas d'articles dans cette langue (/es/blog…) : la page ne serait qu'un doublon
  // de /en/blog avec l'interface traduite → redirection vers la version anglaise.
  if (lang !== locale) permanentRedirect(localizePath(lang as Locale, "/blog"));
  const [posts, categories] = await Promise.all([getPublishedPosts(lang), getCategoriesWithCounts()]);

  return (
    <div className="ma">
      <DesignHeader />
      <main className="page-main" id="contenu">
        <div className="wrap">
          <nav className="breadcrumb" aria-label={t.common.breadcrumb} style={{ paddingTop: 16 }}>
            <Link href="/">{t.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t.nav.blog}</span>
          </nav>
          <div className="page-head">
            <div>
              <div className="eyebrow">{t.blog.eyebrow}</div>
              <h1>{t.blog.title}</h1>
              <p>{t.blog.subtitle}</p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="empty">
              <h3>{t.blog.empty}</h3>
            </div>
          ) : (
            <div className="genre-grid">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="format-card" style={{ textDecoration: "none" }}>
                  {post.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", objectPosition: "center 25%", borderRadius: 12 }}
                    />
                  )}
                  {post.categories[0] && <span className="book-cat">{post.categories[0].category.name}</span>}
                  <h2 style={{ fontSize: 21 }}>{post.title}</h2>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  <span className="opens">
                    {post.author ? `${post.author} · ` : ""}
                    {formatDateLocale(locale, post.publishedAt ?? post.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
