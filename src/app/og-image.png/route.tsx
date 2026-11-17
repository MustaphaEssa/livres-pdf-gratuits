import { ogCard } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 86400;

// Image Open Graph par défaut du site (/og-image.png), référencée par le layout.
export function GET() {
  return ogCard({
    siteName: SITE_NAME,
    title: "Free PDF books — Livres PDF gratuits",
    subtitle: "Public-domain ebooks · PDF · EPUB · Audio",
    badge: "livrespdfgratuits.com",
  });
}
