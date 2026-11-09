/**
 * Rattrapage EPUB « par recherche » pour les livres SANS identifiant Internet
 * Archive. Pour chaque livre PDF sans epubUrl et sans sourceId, cherche sur
 * Internet Archive un ouvrage correspondant (titre + auteur) qui possède un
 * fichier EPUB, avec une correspondance STRICTE pour éviter les faux positifs.
 *
 *   node scripts/backfill-epub-search.mjs            # applique les correspondances sûres
 *   node scripts/backfill-epub-search.mjs --dry-run  # affiche sans rien modifier
 *
 * Quand une correspondance sûre est trouvée, enregistre epubUrl ET sourceId
 * (pour les prochaines fois). Relançable sans risque.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DRY = process.argv.includes("--dry-run");
const UA = "livrespdfgratuits.com (backfill-epub-search)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "et", "ou", "a", "au",
  "aux", "en", "par", "pour", "avec", "sur", "dans", "the", "of", "and", "to",
  "tome", "volume", "vol", "texte", "integral", "edition", "preface", "suivi",
]);

function norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s) {
  return norm(s).split(" ").filter((t) => t.length >= 3 && !STOP.has(t));
}
function surname(author) {
  const parts = norm(author).split(" ").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}
function oneStr(v) {
  return Array.isArray(v) ? (v.length ? String(v[0]) : "") : v == null ? "" : String(v);
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// Cherche un candidat Internet Archive correspondant strictement au livre.
async function findMatch(book) {
  const tTokens = tokens(book.title).slice(0, 8);
  const sn = surname(book.author);
  if (tTokens.length < 1 || !sn) return null;

  const q =
    `title:(${tTokens.join(" AND ")}) AND creator:(${sn}) AND mediatype:(texts)`;
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=downloads" +
    "&sort[]=downloads+desc&rows=5&page=1&output=json";

  let docs = [];
  try {
    docs = (await fetchJson(url))?.response?.docs ?? [];
  } catch {
    return null;
  }

  for (const d of docs) {
    const candTitleTokens = new Set(tokens(oneStr(d.title)));
    const candCreator = norm(oneStr(d.creator));
    // Auteur : le nom de famille doit apparaître
    if (!candCreator.includes(sn)) continue;
    // Titre : au moins 70 % des tokens significatifs du livre présents
    const found = tTokens.filter((t) => candTitleTokens.has(t)).length;
    const ratio = found / tTokens.length;
    if (ratio < 0.7) continue;

    // Vérifie la présence d'un fichier EPUB
    try {
      const meta = await fetchJson(`https://archive.org/metadata/${d.identifier}`);
      const files = meta?.files ?? [];
      const epub = files.find((f) => /\.epub$/i.test(f.name));
      if (epub) {
        return {
          identifier: d.identifier,
          epubUrl: `https://archive.org/download/${d.identifier}/${encodeURIComponent(epub.name)}`,
          candTitle: oneStr(d.title),
          ratio,
        };
      }
    } catch {
      /* candidat suivant */
    }
    await sleep(200);
  }
  return null;
}

async function main() {
  const books = await prisma.book.findMany({
    where: { mediaType: "PDF", epubUrl: null, sourceId: null },
    select: { id: true, slug: true, title: true, author: true },
  });
  console.log(`${books.length} livre(s) sans identifiant à rechercher…${DRY ? " (DRY-RUN)" : ""}`);

  let matched = 0;
  let i = 0;
  for (const b of books) {
    i++;
    const m = await findMatch(b);
    if (m) {
      matched++;
      console.log(
        `✓ [${i}/${books.length}] "${b.title.slice(0, 40)}" → "${m.candTitle.slice(0, 40)}" (${Math.round(m.ratio * 100)}%)`
      );
      if (!DRY) {
        // sourceId est unique : on évite d'écraser un doublon éventuel
        const clash = await prisma.book.findFirst({
          where: { sourceId: m.identifier },
          select: { id: true },
        });
        await prisma.book.update({
          where: { id: b.id },
          data: { epubUrl: m.epubUrl, ...(clash ? {} : { sourceId: m.identifier }) },
        });
      }
    }
    await sleep(300);
  }

  console.log(`\nTerminé : ${matched} correspondance(s) sûre(s) sur ${books.length}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
