import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, User, ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PostComments } from "@/components/blog/post-comments";
import { getPublishedPostBySlug } from "@/lib/posts";
import { getUserSession } from "@/lib/user-server";
import { getServerI18n } from "@/i18n/server";
import { formatDate } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Article introuvable" };
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
    alternates: { canonical: `/blog/${slug}` },
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

  const [session, { t }] = await Promise.all([
    getUserSession(),
    getServerI18n(),
  ]);
  const paragraphs = post.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50">
        <article className="container mx-auto px-4 py-10 max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-amber-500 mb-6"
          >
            <ChevronLeft className="h-4 w-4" /> {t.blog.backToBlog}
          </Link>

          {post.categories[0] && (
            <div className="text-sm text-amber-500 font-medium mb-3">
              {post.categories[0].category.name}
            </div>
          )}

          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
            {post.author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE_URL}/blog/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#1877F2] hover:underline"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
              Partager
            </a>
          </div>

          {post.coverImage && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-8 bg-slate-100 dark:bg-slate-800">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="max-w-none space-y-4">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                {p}
              </p>
            ))}
          </div>

          {/* Commentaires */}
          <PostComments postId={post.id} isLoggedIn={!!session} />
        </article>
      </main>

      <Footer />
    </div>
  );
}
