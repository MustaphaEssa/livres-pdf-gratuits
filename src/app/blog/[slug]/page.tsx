import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { frenchOnlyAlternates } from "@/i18n/seo";
import { formatDateLocale } from "@/i18n/format";
import { notFound } from "next/navigation";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import Icon, { I } from "@/components/design/icon";
import { PostComments } from "@/components/blog/post-comments";
import { FacebookComments } from "@/components/blog/facebook-comments";
import { getPublishedPostBySlug } from "@/lib/posts";
import { getCategoriesWithCounts } from "@/lib/books";
import { getUserSession } from "@/lib/user-server";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import JsonLd, { breadcrumbLd } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [post, { t }] = await Promise.all([getPublishedPostBySlug(slug), getServerI18n()]);
  if (!post) return { title: t.meta.postNotFound };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;
  const image = post.coverImage
    ? post.coverImage.startsWith("http")
      ? post.coverImage
      : `${SITE_URL}${post.coverImage}`
    : undefined;
  return {
    title,
    description,
    alternates: frenchOnlyAlternates(`/blog/${slug}`),
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/blog/${slug}`,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const [session, categories, { locale, t }] = await Promise.all([
    getUserSession(),
    getCategoriesWithCounts(),
    getServerI18n(),
  ]);
  const paragraphs = post.content.split(/\n\s*\n/).filter(Boolean);
  const shareUrl = `${SITE_URL}/blog/${slug}`;
  const postImage = post.coverImage
    ? post.coverImage.startsWith("http")
      ? post.coverImage
      : `${SITE_URL}${post.coverImage}`
    : `${SITE_URL}/og-image.png`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    url: shareUrl,
    mainEntityOfPage: shareUrl,
    image: postImage,
    datePublished: new Date(post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt ?? post.publishedAt ?? post.createdAt).toISOString(),
    author: { "@type": post.author ? "Person" : "Organization", name: post.author || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
    },
    ...(post.excerpt ? { description: post.excerpt } : {}),
  };

  return (
    <div className="ma">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.nav.home, url: "/" },
            { name: t.nav.blog, url: "/blog" },
            { name: post.title, url: `/blog/${slug}` },
          ]),
          articleLd,
        ]}
      />
      <DesignHeader />
      <main className="page-main" id="contenu">
        <article className="wrap" style={{ maxWidth: 820 }} lang="fr">
          <nav className="breadcrumb" aria-label={t.common.breadcrumb} style={{ paddingTop: 16 }}>
            <Link href="/">{t.nav.home}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog">{t.nav.blog}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{post.title}</span>
          </nav>

          <div className="page-head">
            <div>
              {post.categories[0] && <div className="eyebrow">{post.categories[0].category.name}</div>}
              <h1>{post.title}</h1>
              <p style={{ color: "var(--muted)", marginTop: 10 }}>
                {post.author ? `${post.author} · ` : ""}
                {formatDateLocale(locale, post.publishedAt ?? post.createdAt)}
                {"  "}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent)", fontWeight: 600, marginLeft: 8 }}
                >
                  {t.common.share}
                </a>
              </p>
            </div>
          </div>

          {post.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImage}
              alt={post.title}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 16, marginBottom: 28 }}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {paragraphs.map((p, i) => (
              <p key={i} className="prose" style={{ maxWidth: "none" }}>
                {p}
              </p>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <PostComments postId={post.id} isLoggedIn={!!session} />
            <FacebookComments url={shareUrl} />
          </div>

          <p style={{ marginTop: 32 }}>
            <Link href="/blog" className="link-arrow">
              <Icon d={I.chevL} /> {t.blog.backToBlog}
            </Link>
          </p>
        </article>
      </main>
      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
