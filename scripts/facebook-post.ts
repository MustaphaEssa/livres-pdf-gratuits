/**
 * Publie automatiquement un contenu sur la page Facebook :
 *   - en priorité un ARTICLE de blog pas encore partagé
 *   - sinon UN LIVRE PAR LANGUE (FACEBOOK_BOOK_LANGS, défaut "fr,en") : le plus
 *     populaire (téléchargements, puis vues) pas encore partagé, avec un texte et
 *     un lien dans la langue du livre (fr → /livre/…, en → /en/book/…)
 * Au plus FACEBOOK_BOOKS_PER_DAY livres/jour PAR LANGUE (défaut 12).
 * Cron conseillé (toutes les 2 h → 12 fr + 12 en par jour) :
 *   0 0-22/2 * * * cd /chemin/du/site && ./node_modules/.bin/tsx scripts/facebook-post.ts
 *
 * Requiert dans .env :
 *   FACEBOOK_PAGE_ID=...        (ID de la page)
 *   FACEBOOK_PAGE_TOKEN=...     (jeton de page permanent)
 *   NEXT_PUBLIC_SITE_URL=https://livrespdfgratuits.com
 *   (optionnel) FACEBOOK_GRAPH_VERSION=v21.0
 *   (optionnel) FACEBOOK_BOOKS_PER_DAY=12
 *   (optionnel) FACEBOOK_BOOK_LANGS=fr,en
 *   (optionnel) FACEBOOK_DRY_RUN=1   (affiche les posts sans rien publier)
 *
 * Lancer : ./node_modules/.bin/tsx scripts/facebook-post.ts
 */
import { PrismaClient } from "@prisma/client";
import { formatAuthorName } from "../src/lib/utils";
import { localizePath } from "../src/i18n/config";

const prisma = new PrismaClient();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://livrespdfgratuits.com";
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const TOKEN = process.env.FACEBOOK_PAGE_TOKEN;
const GRAPH = process.env.FACEBOOK_GRAPH_VERSION || "v21.0";
// Quoi partager : "books" (livres seulement), "posts" (articles seulement),
// "all" (articles prioritaires puis livres). Défaut : all.
const SHARE = (process.env.FACEBOOK_SHARE || "all").toLowerCase();
// Nombre max de livres partagés par jour ET par langue (les plus populaires d'abord).
const BOOKS_PER_DAY = Math.max(1, Number(process.env.FACEBOOK_BOOKS_PER_DAY) || 12);
// Les articles de blog partagés sont ceux en anglais (pages /en/blog/…).
const LOCALE = "en" as const;
// Mode test : affiche les posts sans rien publier ni marquer comme partagé.
const DRY_RUN = process.env.FACEBOOK_DRY_RUN === "1";

// Texte du post selon la langue du livre. Une langue absente d'ici est ignorée.
const BOOK_TEXT = {
  fr: (author: string) => `par ${author} — livre gratuit à télécharger en PDF et à lire en ligne 👇`,
  en: (author: string) => `by ${author} — free book to download as PDF and read online 👇`,
} as const;
type BookLang = keyof typeof BOOK_TEXT;
const BOOK_LANGS = (process.env.FACEBOOK_BOOK_LANGS || "fr,en")
  .split(",")
  .map((l) => l.trim().toLowerCase())
  .filter((l): l is BookLang => l in BOOK_TEXT);

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
  if (DRY_RUN) {
    console.log(`--- [test] ---
${message}

${link}
(couverture : ${absoluteUrl(cover) ?? "aucune"})`);
    return "test";
  }
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
      where: { isPublished: true, fbPostedAt: null, language: LOCALE }, // articles anglais seulement
      orderBy: { publishedAt: "desc" },
    });
    if (post) {
      const link = `${SITE_URL}${localizePath(LOCALE, `/blog/${post.slug}`)}`;
      const msg = `📝 ${post.title}${post.excerpt ? `\n\n${post.excerpt}` : ""}\n\nRead it on our blog 👇`;
      const fbId = await share(msg, link, post.coverImage);
      if (!DRY_RUN) await prisma.post.update({ where: { id: post.id }, data: { fbPostedAt: new Date() } });
      console.log(`✅ Article partagé : « ${post.title} » (post Facebook ${fbId})`);
      return;
    }
  }

  // 2. Un livre par langue : le PLUS POPULAIRE pas encore partagé — sauf en mode "posts".
  //    Plafond de BOOKS_PER_DAY livres par jour et par langue. Un échec sur une
  //    langue n'empêche pas de publier l'autre.
  if (SHARE !== "posts") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    let failed = false;
    for (const lang of BOOK_LANGS) {
      try {
        const sharedToday = await prisma.book.count({
          where: { language: lang, fbPostedAt: { gte: startOfDay } },
        });
        if (sharedToday >= BOOKS_PER_DAY) {
          console.log(`[${lang}] Quota atteint : ${sharedToday}/${BOOKS_PER_DAY} livres déjà partagés aujourd'hui.`);
          continue;
        }
        const book = await prisma.book.findFirst({
          where: { isPublished: true, fbPostedAt: null, language: lang },
          orderBy: [{ downloadCount: "desc" }, { viewCount: "desc" }, { createdAt: "asc" }],
          select: { id: true, slug: true, title: true, author: true, coverImage: true },
        });
        if (!book) {
          console.log(`[${lang}] Rien de nouveau à partager.`);
          continue;
        }
        const link = `${SITE_URL}${localizePath(lang, `/livre/${book.slug}`)}`;
        const msg = `📖 ${book.title}

${BOOK_TEXT[lang](formatAuthorName(book.author))}`;
        const fbId = await share(msg, link, book.coverImage);
        if (!DRY_RUN) {
          await prisma.book.update({ where: { id: book.id }, data: { fbPostedAt: new Date() } });
        }
        console.log(
          `✅ [${lang}] Livre partagé (${sharedToday + 1}/${BOOKS_PER_DAY} aujourd'hui) : « ${book.title} » (post Facebook ${fbId})`
        );
      } catch (e) {
        failed = true;
        console.error(`❌ [${lang}] Échec du partage :`, e instanceof Error ? e.message : e);
      }
    }
    if (failed) process.exitCode = 1;
    return;
  }

  console.log("Rien de nouveau à partager — tout a déjà été publié sur Facebook.");
}

main()
  .catch((e) => {
    console.error("Échec du partage Facebook :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
