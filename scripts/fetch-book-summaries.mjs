/**
 * Résumés de livres depuis Wikipédia.
 *
 * Beaucoup de fiches n'ont qu'une description générée d'une ligne : Google les
 * juge trop pauvres (« Explorée, actuellement non indexée »). Pour chaque livre
 * sans vraie description, on cherche l'article Wikipédia de l'ŒUVRE (dans la
 * langue du livre, repli français) et on enregistre son introduction, avec
 * l'URL de l'article (attribution CC BY-SA affichée sur la fiche).
 *
 * Correspondance STRICTE pour éviter les faux résumés :
 *  - le titre de l'article (sans « (roman) », « (Hugo) »…) doit être le début
 *    du titre du livre (« Madame Bovary » ↔ « Madame Bovary : mœurs de province ») ;
 *  - l'introduction doit citer le nom de famille de l'auteur ;
 *  - pas de page d'homonymie, introduction d'au moins 200 caractères.
 *
 *   node scripts/fetch-book-summaries.mjs            # aperçu (n'écrit rien)
 *   node scripts/fetch-book-summaries.mjs --apply    # enregistre
 *   LIMIT=50 node scripts/fetch-book-summaries.mjs   # sur les 50 premiers
 *
 * Relançable : ne touche jamais une description déjà utile.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const LIMIT = Number(process.env.LIMIT) || Infinity;
const UA = "livrespdfgratuits.com book-summaries/1.0";
const WIKI_LANGS = new Set(["fr", "en", "es", "de", "it", "pt", "nl", "ar", "ru", "tr", "zh", "ja"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mêmes règles que src/lib/book-description.ts (notes techniques ≠ résumé)
const JUNK = [
  /digiti[sz]ed\s+by/i, /uploaded\s+by/i, /scanned\s+(by|in|from)/i, /google\s+books?/i,
  /internet\s+archive/i, /digiti[sz]ation\s+(program|project)/i, /brittle\s+books/i,
  /archive\.org/i, /\barlima\b/i, /^\s*bound\s+by/i, /original\s+(paper\s+)?wrappers/i,
  /errata\s+slip/i, /\bt\.\s?p\./i, /frontispiece|leaves\s+of\s+plates|microform|microfilm/i,
  /includes\s+(bibliographical|index)/i, /\b\d+\s?cm\b/i, /^\s*https?:\/\/\S+\s*$/i, /^\s*\[?\d{3,4}\]?\s*$/,
];
// Anciennes descriptions générées enregistrées en base (« « X » est un ouvrage
// de … Ce livre du domaine public … ») : à remplacer par un vrai résumé.
const GENERATED = /est un ouvrage de .*domaine public/is;
const isUseful = (d) => {
  const s = (d ?? "").trim();
  return s.length >= 60 && !JUNK.some((re) => re.test(s)) && !GENERATED.test(s);
};

const norm = (s) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// « Hugo, Victor, 1802-1885 » → « hugo » ; « Victor Hugo » → « hugo »
function surname(rawAuthor) {
  const s = rawAuthor.replace(/\[.*?\]|\(.*?\)/g, "").replace(/\d{3,4}\s*-\s*\d{0,4}/g, "").trim();
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const name = parts.length >= 2 ? parts[0] : s.split(/\s+/).pop();
  return norm(name ?? "");
}

function displayAuthor(rawAuthor) {
  const s = rawAuthor.replace(/\[.*?\]/g, "").replace(/\d{3,4}\s*-\s*\d{0,4}/g, "").replace(/[;,]\s*$/, "").trim();
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : s;
}

async function searchWiki(lang, title, author) {
  const q = `${title.split(/\s[:;(]\s?|\s\/\s/)[0]} ${displayAuthor(author)}`;
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&redirects=1&formatversion=2` +
    `&prop=extracts|pageprops|info&inprop=url&exintro=1&explaintext=1&ppprop=disambiguation` +
    `&generator=search&gsrlimit=5&gsrsearch=${encodeURIComponent(q)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) { await sleep(5000); continue; }
      if (!res.ok) return [];
      const d = await res.json();
      return (d?.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    } catch {
      await sleep(2000);
    }
  }
  return [];
}

const LITERARY =
  /\b(roman|nouvelle|livre|piece|theatre|poeme|poesie|recueil|essai|conte|fable|tragedie|comedie|drame|novel|novella|book|play|poem|story|novela|libro|obra|romanzo|buch|erzahlung|gedicht|romance|livro|boek|toneelstuk)\b/;

const NOT_BOOK =
  /\b(film|films|musicale|musical|opera|serie|telefilm|album|chanson|song|jeu|game|ballet|bande dessinee|comic|anime|manga|adaptation|tv|television)\b/;
const CHARACTER = /\b(personnage|character|personaje|personaggio|figur|personagem|personage)\b/;

function pickMatch(pages, book) {
  const bookTitle = norm(book.title);
  const sn = surname(book.author);
  if (sn.length < 3) return null;
  for (const p of pages) {
    if (p.pageprops && "disambiguation" in p.pageprops) continue;
    // « La Tulipe noire (film) » ≠ le livre : la précision entre parenthèses
    // doit désigner un écrit (roman, pièce, poème…) ou l'auteur.
    const paren = norm(p.title.match(/\(([^)]*)\)\s*$/)?.[1] ?? "");
    if (paren && (NOT_BOOK.test(paren) || !(LITERARY.test(paren) || paren.includes(sn)))) continue;
    const base = norm(p.title.replace(/\s*\(.*?\)\s*$/, ""));
    if (base.length < 4) continue;
    // Le titre de l'article doit être le début du titre du livre (mot entier)
    if (!(bookTitle === base || bookTitle.startsWith(base + " "))) continue;
    // Un titre d'article trop court face à un titre de livre long = risque (ex. « Poésies »)
    if (base.split(" ").length === 1 && bookTitle.split(" ").length > 4) continue;
    const extract = (p.extract ?? "").trim();
    if (extract.length < 200) continue;
    if (!norm(extract).includes(sn)) continue;
    // 1re phrase : l'article doit décrire une œuvre, pas un personnage / un film…
    const lead = norm(extract.split(/(?<=[.!?。])\s/)[0]);
    if (CHARACTER.test(lead) || (NOT_BOOK.test(lead) && !LITERARY.test(lead))) continue;
    // L'article parle d'une œuvre, pas de l'auteur lui-même
    if (norm(p.title).includes(sn) && !bookTitle.includes(sn)) continue;
    return { text: cleanExtract(extract), url: p.fullurl ?? p.canonicalurl, title: p.title };
  }
  return null;
}

// Extrait COURT (citation attribuée, pas une copie d'article) : 1er paragraphe,
// coupé à la fin d'une phrase vers ~700 caractères. L'essentiel du contenu
// unique de la fiche vient du site lui-même (FAQ, fiche technique, auteur…).
const MAX = 700;
function cleanExtract(s) {
  // Paragraphes jusqu'à au moins ~300 caractères (le 1er est parfois une seule ligne)
  const paras = s.split(/\n+/).map((x) => x.trim()).filter((x) => x.length > 40);
  let first = "";
  for (const p of paras) {
    first = first ? `${first} ${p}` : p;
    if (first.length >= 300) break;
  }
  if (!first) first = s.trim();
  if (first.length <= MAX) return first;
  const cut = first.slice(0, MAX);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("。"), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 200 ? cut.slice(0, end + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}

async function main() {
  const books = await prisma.book.findMany({
    where: { isPublished: true, descriptionSource: null },
    select: { id: true, title: true, author: true, description: true, language: true },
    orderBy: { viewCount: "desc" },
  });
  const todo = books.filter((b) => !isUseful(b.description)).slice(0, LIMIT);
  console.log(`${books.length} livres sans source, ${todo.length} sans vraie description → recherche Wikipédia${APPLY ? "" : " (APERÇU, --apply pour enregistrer)"}`);

  let found = 0;
  for (const [i, book] of todo.entries()) {
    const langs = [...new Set([WIKI_LANGS.has(book.language) ? book.language : "fr", "fr"])];
    let match = null;
    for (const lang of langs) {
      match = pickMatch(await searchWiki(lang, book.title, book.author), book);
      await sleep(300);
      if (match) break;
    }
    if (!match) continue;
    found++;
    console.log(`✓ [${i + 1}/${todo.length}] ${book.title} — ${displayAuthor(book.author)}  →  ${match.title}  (${match.text.length} car.)`);
    if (APPLY) {
      await prisma.book.update({
        where: { id: book.id },
        data: { description: match.text, descriptionSource: match.url },
      });
    }
  }
  console.log(`\n${found}/${todo.length} résumés trouvés${APPLY ? " et enregistrés" : " (rien n'a été écrit)"}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
