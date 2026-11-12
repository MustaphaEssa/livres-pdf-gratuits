/**
 * Publie automatiquement un contenu sur la page Facebook :
 *   - en priorité un ARTICLE de blog pas encore partagé
 *   - sinon un LIVRE pas encore partagé
 * Poste 1 élément par exécution (à lancer via cron, ex. 1-2x/jour).
 *
 * Requiert dans .env :
 *   FACEBOOK_PAGE_ID=...        (ID de la page)
 *   FACEBOOK_PAGE_TOKEN=...     (jeton de page permanent)
 *   NEXT_PUBLIC_SITE_URL=https://livrespdfgratuits.com
 *   (optionnel) FACEBOOK_GRAPH_VERSION=v21.0
 *
 * Lancer : ./node_modules/.bin/tsx scripts/facebook-post.ts
 */
import { PrismaClient } from "@prisma/client";
import { formatAuthorName } from "../src/lib/utils";

const prisma = new PrismaClient();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://livrespdfgratuits.com";
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const TOKEN = process.env.FACEBOOK_PAGE_TOKEN;
const GRAPH = process.env.FACEBOOK_GRAPH_VERSION || "v21.0";
// Quoi partager : "books" (livres seulement), "posts" (articles seulement),
// "all" (articles prioritaires puis livres). Défaut : all.
const SHARE = (process.env.FACEBOOK_SHARE || "all").toLowerCase();

// Transforme un chemin de couverture en URL absolue publique (requis par Facebook).
function absoluteUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Publication « lien » classique (repli quand aucune couverture n'est dispo).
// À éviter : Facebook réduit la portée des posts sans média natif.
async function postLinkToFacebook(message: string, link: string): Promise<string> {
  const url = `https://graph.facebook.com/${GRAPH}/${PAGE_ID}/feed`;
  const body = new URLSearchParams({ message, link, access_token: TOKEN as string });
  const res = await fetch(url, { method: "POST", body });
  const data = (await res.json()) as { id?: string; error?: unknown };
  if (!res.ok || data.error) {
    throw new Error(JSON.stringify(data.error ?? data));
  }
  return data.id ?? "";
}

// Publication PHOTO native : la couverture est postée comme vraie image et le
// lien est inclus dans la légende. Facebook traite ça comme un post avec média
// (meilleure portée) au lieu d'un simple partage de lien.
async function postPhotoToFacebook(
  caption: string,
  imageUrl: string,
): Promise<string> {
  const url = `https://graph.facebook.com/${GRAPH}/${PAGE_ID}/photos`;
  const body = new URLSearchParams({
    url: imageUrl,
    caption,
    access_token: TOKEN as string,
  });
  const res = await fetch(url, { method: "POST", body });
  const data = (await res.json()) as { id?: string; post_id?: string; error?: unknown };
  if (!res.ok || data.error) {
    throw new Error(JSON.stringify(data.error ?? data));
  }
  return data.post_id ?? data.id ?? "";
}

// Poste en photo si une couverture est dispo, sinon repli sur le lien.
async function share(message: string, link: string, cover?: string | null): Promise<string> {
  const img = absoluteUrl(cover);
  if (img) {
    try {
      return await postPhotoToFacebook(`${message}\n\n${link}`, img);
    } catch (e) {
      // Image inaccessible / refusée par Facebook → on bascule sur le lien.
      console.warn("⚠️ Photo refusée, repli sur lien :", e instanceof Error ? e.message : e);
    }
  }
  return postLinkToFacebook(message, link);
}

async function main() {
  if (!PAGE_ID || !TOKEN) {
    console.error("⛔ FACEBOOK_PAGE_ID et FACEBOOK_PAGE_TOKEN requis dans .env");
    process.exit(1);
  }

  // 1. Article de blog non encore partagé (priorité) — sauf en mode "books"
  if (SHARE !== "books") {
    const post = await prisma.post.findFirst({
      where: { isPublished: true, fbPostedAt: null },
      orderBy: { publishedAt: "desc" },
    });
    if (post) {
      const link = `${SITE_URL}/blog/${post.slug}`;
      const msg = `📝 ${post.title}${post.excerpt ? `\n\n${post.excerpt}` : ""}\n\nÀ lire sur notre blog 👇`;
      const fbId = await share(msg, link, post.coverImage);
      await prisma.post.update({ where: { id: post.id }, data: { fbPostedAt: new Date() } });
      console.log(`✅ Article partagé : « ${post.title} » (post Facebook ${fbId})`);
      return;
    }
  }

  // 2. Un livre non encore partagé (les plus anciens d'abord) — sauf en mode "posts"
  if (SHARE !== "posts") {
    const book = await prisma.book.findFirst({
      where: { isPublished: true, fbPostedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true, title: true, author: true, coverImage: true },
    });
    if (book) {
      const link = `${SITE_URL}/livre/${book.slug}`;
      const msg = `📖 ${book.title}\n\npar ${formatAuthorName(book.author)} — livre gratuit à télécharger en PDF et à lire en ligne 👇`;
      const fbId = await share(msg, link, book.coverImage);
      await prisma.book.update({ where: { id: book.id }, data: { fbPostedAt: new Date() } });
      console.log(`✅ Livre partagé : « ${book.title} » (post Facebook ${fbId})`);
      return;
    }
  }

  console.log("Rien de nouveau à partager — tout a déjà été publié sur Facebook.");
}

main()
  .catch((e) => {
    console.error("Échec du partage Facebook :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
