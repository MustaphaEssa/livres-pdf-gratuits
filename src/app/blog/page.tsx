import Link from "next/link";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import { getPublishedPosts } from "@/lib/posts";
import { getCategoriesWithCounts } from "@/lib/books";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Blog",
  description: "Actualités, conseils et réflexions sur le monde du livre et de la lecture.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getPublishedPosts(),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="ma">
      <DesignHeader />
      <main className="page-main">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Fil d'Ariane" style={{ paddingTop: 16 }}>
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Blog</span>
          </nav>
          <div className="page-head">
            <div>
              <div className="eyebrow">Le journal</div>
              <h1>Blog</h1>
              <p>Actualités, conseils et réflexions sur le monde du livre et de la lecture.</p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="empty">
              <h3>Aucun article pour le moment</h3>
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
                      style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12 }}
                    />
                  )}
                  {post.categories[0] && <span className="book-cat">{post.categories[0].category.name}</span>}
                  <h2 style={{ fontSize: 21 }}>{post.title}</h2>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  <span className="opens">
                    {post.author ? `${post.author} · ` : ""}
                    {formatDate(post.publishedAt ?? post.createdAt)}
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
