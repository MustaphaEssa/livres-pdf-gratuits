import prisma from "@/lib/db";
import { ogCard, fetchImageData } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";
import { formatAuthorName } from "@/lib/utils";

export const runtime = "nodejs";

// Carte Open Graph 1200×630 d'un livre : couverture + titre + auteur.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { title: true, author: true, coverImage: true, mediaType: true, isPublished: true },
  });
  if (!book || !book.isPublished) return new Response("Not found", { status: 404 });

  // Couvertures locales (/uploads/…) : lues via le serveur lui-même.
  const coverUrl = book.coverImage
    ? book.coverImage.startsWith("http")
      ? book.coverImage
      : new URL(book.coverImage, request.url).toString()
    : null;
  const cover = coverUrl ? await fetchImageData(coverUrl) : null;

  return ogCard({
    siteName: SITE_NAME,
    title: book.title,
    subtitle: formatAuthorName(book.author),
    badge: book.mediaType === "AUDIO" ? "Audio · Free" : "PDF · Free download",
    cover,
  });
}
