/**
 * Importe une liste choisie de grands classiques depuis Project Gutenberg
 * (PDF léger généré + EPUB + couverture + audio LibriVox s'il existe).
 *
 * Chaque œuvre est désignée par son numéro Gutenberg (anglais) ou par une recherche
 * titre + auteur (traductions françaises). Avant tout téléchargement, la ligne du
 * catalogue officiel est vérifiée : le titre ET le nom de l'auteur doivent
 * correspondre, sinon l'œuvre est ignorée (pas d'import sur un mauvais numéro).
 *
 *   ./node_modules/.bin/tsx scripts/import-classics.ts          # aperçu
 *   ./node_modules/.bin/tsx scripts/import-classics.ts --apply  # importe
 *
 * src/lib/gutenberg.ts importe "server-only" (fourni par Next, absent hors build) :
 * on le remplace par un module vide avant de charger le code d'import.
 * Relançable : les œuvres déjà présentes (même numéro Gutenberg, ou même titre +
 * auteur) sont ignorées par importGutenbergBook.
 */
import Module from "node:module";
import type { GutenbergRow } from "@/lib/gutenberg";

const M = Module as unknown as { _resolveFilename: (req: string, ...rest: unknown[]) => string };
const resolve = M._resolveFilename;
M._resolveFilename = function (req: string, ...rest: unknown[]) {
  if (req === "server-only") return require.resolve("./stubs/empty.cjs");
  return resolve.call(this, req, ...rest);
};

const APPLY = process.argv.includes("--apply");
const NO_AUDIO = process.argv.includes("--no-audio");

interface Wanted {
  /** Numéro Gutenberg (si connu) */
  id?: number;
  /** Fragment du titre attendu (vérification, ou recherche si pas d'id) */
  title: string;
  /** Nom d'auteur affiché sur le site */
  author: string;
  lang: "en" | "fr";
}

const WANTED: Wanted[] = [
  // ---- Anglais
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen", lang: "en" },
  { id: 161, title: "Sense and Sensibility", author: "Jane Austen", lang: "en" },
  { id: 158, title: "Emma", author: "Jane Austen", lang: "en" },
  { id: 105, title: "Persuasion", author: "Jane Austen", lang: "en" },
  { id: 121, title: "Northanger Abbey", author: "Jane Austen", lang: "en" },
  { id: 141, title: "Mansfield Park", author: "Jane Austen", lang: "en" },
  { id: 768, title: "Wuthering Heights", author: "Emily Brontë", lang: "en" },
  { id: 1260, title: "Jane Eyre", author: "Charlotte Brontë", lang: "en" },
  { id: 46, title: "A Christmas Carol", author: "Charles Dickens", lang: "en" },
  { id: 1400, title: "Great Expectations", author: "Charles Dickens", lang: "en" },
  { id: 730, title: "Oliver Twist", author: "Charles Dickens", lang: "en" },
  { id: 98, title: "A Tale of Two Cities", author: "Charles Dickens", lang: "en" },
  { id: 766, title: "David Copperfield", author: "Charles Dickens", lang: "en" },
  { id: 345, title: "Dracula", author: "Bram Stoker", lang: "en" },
  { id: 84, title: "Frankenstein", author: "Mary Shelley", lang: "en" },
  { id: 1661, title: "Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", lang: "en" },
  { id: 2852, title: "Hound of the Baskervilles", author: "Arthur Conan Doyle", lang: "en" },
  { id: 244, title: "Study in Scarlet", author: "Arthur Conan Doyle", lang: "en" },
  { id: 174, title: "Picture of Dorian Gray", author: "Oscar Wilde", lang: "en" },
  { id: 43, title: "Jekyll", author: "Robert Louis Stevenson", lang: "en" },
  { id: 120, title: "Treasure Island", author: "Robert Louis Stevenson", lang: "en" },
  { title: "Odyssey", author: "Homer", lang: "en" },
  { id: 2199, title: "Iliad", author: "Homer", lang: "en" },
  { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", lang: "en" },
  { id: 2701, title: "Moby Dick", author: "Herman Melville", lang: "en" },
  { id: 74, title: "Adventures of Tom Sawyer", author: "Mark Twain", lang: "en" },
  { id: 76, title: "Huckleberry Finn", author: "Mark Twain", lang: "en" },
  { id: 36, title: "War of the Worlds", author: "H. G. Wells", lang: "en" },
  { id: 514, title: "Little Women", author: "Louisa May Alcott", lang: "en" },
  { id: 1184, title: "Count of Monte Cristo", author: "Alexandre Dumas", lang: "en" },
  { id: 1257, title: "Three Musketeers", author: "Alexandre Dumas", lang: "en" },
  { id: 2600, title: "War and Peace", author: "Leo Tolstoy", lang: "en" },
  { id: 1399, title: "Anna Karenina", author: "Leo Tolstoy", lang: "en" },
  { id: 2554, title: "Crime and Punishment", author: "Fyodor Dostoyevsky", lang: "en" },
  { id: 2591, title: "Grimm", author: "Jacob Grimm", lang: "en" },
  { id: 64317, title: "The Great Gatsby", author: "F. Scott Fitzgerald", lang: "en" },
  // ---- Traductions françaises (recherche titre + auteur dans le catalogue)
  { title: "Odyssée", author: "Homère", lang: "fr" },
  { title: "Orgueil et préjugés", author: "Jane Austen", lang: "fr" },
  { title: "Hauts de Hurle", author: "Emily Brontë", lang: "fr" },
  { title: "Jane Eyre", author: "Charlotte Brontë", lang: "fr" },
  { title: "Conte de Noël", author: "Charles Dickens", lang: "fr" },
  { title: "Chant de Noël", author: "Charles Dickens", lang: "fr" },
  { title: "Dracula", author: "Bram Stoker", lang: "fr" },
  { title: "Chien des Baskerville", author: "Arthur Conan Doyle", lang: "fr" },
  { title: "Portrait de Dorian Gray", author: "Oscar Wilde", lang: "fr" },
  { title: "Alice au pays des merveilles", author: "Lewis Carroll", lang: "fr" },
  { title: "Crime et châtiment", author: "Fiodor Dostoïevski", lang: "fr" },
  { title: "Anna Karénine", author: "Léon Tolstoï", lang: "fr" },
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Nom de famille « translittéré » le plus probable dans le champ Authors de Gutenberg
const SURNAME_ALIASES: Record<string, string[]> = {
  "Homère": ["homer"],
  "Fiodor Dostoïevski": ["dostoyevsky", "dostoievski", "dostoevsky", "dostoievsky"],
  "Léon Tolstoï": ["tolstoy", "tolstoi"],
  "Fyodor Dostoyevsky": ["dostoyevsky", "dostoevsky"],
  "Leo Tolstoy": ["tolstoy"],
  "Emily Brontë": ["bronte"],
  "Charlotte Brontë": ["bronte"],
};
function surnames(author: string): string[] {
  return SURNAME_ALIASES[author] ?? [norm(author).split(" ").pop()!];
}

function matches(row: GutenbergRow, w: Wanted): boolean {
  const langs = row.language.toLowerCase().split(/[;,\s]+/);
  if (!langs.includes(w.lang)) return false;
  if (!norm(row.title).includes(norm(w.title))) return false;
  const a = norm(row.authors);
  return surnames(w.author).some((s) => a.includes(s));
}

async function main() {
  const { default: prisma } = await import("@/lib/db");
  const { loadCatalog, importGutenbergBook } = await import("@/lib/gutenberg");
  try {
    await run(prisma, loadCatalog, importGutenbergBook);
  } finally {
    await prisma.$disconnect();
  }
}

async function run(
  prisma: typeof import("@/lib/db").default,
  loadCatalog: typeof import("@/lib/gutenberg").loadCatalog,
  importGutenbergBook: typeof import("@/lib/gutenberg").importGutenbergBook
) {
  const catalog = await loadCatalog();
  const byId = new Map(catalog.map((r) => [r.id, r]));
  const cats = await prisma.category.findMany({ where: { type: "BOOK" }, select: { slug: true, id: true } });
  const categoryMap: Record<string, string> = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const plan: { w: Wanted; row: GutenbergRow }[] = [];
  for (const w of WANTED) {
    let row: GutenbergRow | undefined;
    if (w.id) {
      row = byId.get(w.id);
      if (row && !matches(row, w)) {
        console.log(`✗ #${w.id} ne correspond pas à « ${w.title} » (${row.title} — ${row.authors}) : ignoré`);
        continue;
      }
    } else {
      // Recherche : la ligne au titre le plus court (évite extraits/commentaires)
      row = catalog.filter((r) => matches(r, w)).sort((a, b) => a.title.length - b.title.length)[0];
    }
    if (!row) {
      console.log(`– introuvable sur Gutenberg : ${w.title} (${w.author}, ${w.lang})`);
      continue;
    }
    plan.push({ w, row });
    console.log(`✓ #${row.id} [${w.lang}] ${row.title.replace(/\s+/g, " ").slice(0, 80)} — ${row.authors.slice(0, 60)}`);
  }

  console.log(`\n${plan.length} œuvre(s) à importer sur ${WANTED.length}.`);
  if (!APPLY) {
    console.log("Aperçu seulement. Ajouter --apply pour importer.");
    return;
  }

  const counts: Record<string, number> = {};
  for (const { w, row } of plan) {
    try {
      const r = await importGutenbergBook(row, w.author, categoryMap, !NO_AUDIO, w.lang);
      counts[r.status] = (counts[r.status] ?? 0) + 1;
      console.log(`  ${r.status.padEnd(9)} ${row.title.replace(/\s+/g, " ").slice(0, 70)}`);
    } catch (e) {
      counts.fail = (counts.fail ?? 0) + 1;
      console.log(`  fail      ${row.title.slice(0, 70)} : ${(e as Error).message}`);
    }
  }
  console.log("\nBilan :", counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
