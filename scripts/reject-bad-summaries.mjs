/**
 * Retire les « résumés » Wikipédia qui décrivent l'AUTEUR et non le livre.
 *
 * Cas repéré : un livre qui porte le nom de son auteur (« Victor Hugo intime »,
 * « Honoré de Balzac », bulletins d'une société savante…) récupérait l'article
 * Wikipédia de la personne ou de l'organisation : sa biographie s'affichait comme
 * résumé du livre.
 *
 * Règle : l'article Wikipédia (titre sans parenthèses) a le même nom que l'auteur,
 * ou le livre a le même titre que son auteur.
 *
 *   node scripts/reject-bad-summaries.mjs            # aperçu
 *   node scripts/reject-bad-summaries.mjs --apply    # corrige
 *
 * Correction : description vidée (la fiche affiche alors sa description générée),
 * source marquée « rejected:<url> » pour que fetch-book-summaries ne la reprenne pas.
 * Réversible : l'URL d'origine reste dans descriptionSource.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const norm = (s) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\d{3,4}\s*-\s*\d{0,4}/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// « Hugo, Victor, 1802-1885 » → « victor hugo »
function authorKey(raw) {
  const parts = String(raw ?? "")
    .replace(/\d{3,4}\s*-\s*\d{0,4}/g, "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return norm(parts.length === 2 ? `${parts[1]} ${parts[0]}` : parts[0] ?? "");
}

function wikiTitle(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "").replace(/_/g, " ");
  } catch {
    return "";
  }
}

function describesAuthor(book) {
  const a = authorKey(book.author);
  if (!a) return false;
  const w = norm(wikiTitle(book.descriptionSource));
  const t = norm(book.title);
  return w === a || t === a || (w.split(" ").length >= 2 && a.includes(w));
}

const books = await prisma.book.findMany({
  where: { descriptionSource: { startsWith: "http" } },
  select: { id: true, title: true, author: true, descriptionSource: true },
});
const bad = books.filter(describesAuthor);
console.log(`${books.length} résumé(s) Wikipédia, ${bad.length} à retirer :`);
for (const b of bad.slice(0, 60)) console.log(`  ${b.title.slice(0, 70)} — ${b.author}  →  ${wikiTitle(b.descriptionSource)}`);

if (APPLY) {
  for (const b of bad)
    await prisma.book.update({
      where: { id: b.id },
      data: { description: null, descriptionSource: `rejected:${b.descriptionSource}` },
    });
  console.log(`✓ ${bad.length} résumé(s) retiré(s).`);
} else console.log("Aperçu seulement. Ajouter --apply.");
await prisma.$disconnect();
