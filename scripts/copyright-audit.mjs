/**
 * Contrôle « domaine public » du catalogue, à faire AVANT toute demande AdSense
 * (Google refuse les sites qui proposent des œuvres protégées).
 *
 * Règle retenue : la plus stricte des grands marchés, l'UE (70 ans après la mort
 * de l'auteur, au 1er janvier). En 2026, une œuvre est libre si l'auteur est mort
 * en 1955 ou avant.
 *
 * Année de décès : fiche Author (Wikipédia), sinon dates dans le nom importé
 * (« Hugo, Victor, 1802-1885 »).
 *
 *   « protégé »    : auteur mort après la limite  → à dépublier
 *   « à vérifier » : décès inconnu ET publié en 1931 ou après (ou année inconnue
 *                    avec --strict) → contrôle manuel conseillé
 *
 *   node scripts/copyright-audit.mjs                    # aperçu, n'écrit rien
 *   node scripts/copyright-audit.mjs --apply            # dépublie les « protégé »
 *   node scripts/copyright-audit.mjs --apply --unknown  # dépublie aussi les « à vérifier »
 *   node scripts/copyright-audit.mjs --strict           # année de publication inconnue = à vérifier
 *
 * RÉVERSIBLE : on passe isPublished à false (rien n'est supprimé, fichiers gardés).
 * Un CSV de la liste est écrit dans copyright-audit.csv pour relecture / rétablissement.
 */
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const UNKNOWN = process.argv.includes("--unknown");
const STRICT = process.argv.includes("--strict");
const LAST_FREE_DEATH = new Date().getFullYear() - 71; // 2026 → 1955
const LAST_SAFE_PUBLICATION = 1930; // USA : publié avant 1931 = domaine public en 2026

// « Nom, Prénom, 1802-1885 » → 1885 ; « 1871-1922 » → 1922
function deathFromName(raw) {
  const m = (raw ?? "").match(/\b(1[5-9]\d\d)\s*-\s*(1[5-9]\d\d|20\d\d)\b/);
  return m ? Number(m[2]) : null;
}

const books = await prisma.book.findMany({
  where: { isPublished: true },
  select: { id: true, slug: true, title: true, author: true, authorSlug: true, publishedYear: true, sourceId: true },
});
const slugs = [...new Set(books.map((b) => b.authorSlug).filter(Boolean))];
const authors = await prisma.author.findMany({ where: { slug: { in: slugs } }, select: { slug: true, deathYear: true } });
const deathBySlug = new Map(authors.map((a) => [a.slug, a.deathYear]));

const rows = [];
for (const b of books) {
  // Gutenberg ne publie que du domaine public US ; on applique quand même la règle UE.
  const death = deathBySlug.get(b.authorSlug) ?? deathFromName(b.author);
  let status = null;
  if (death != null) {
    if (death > LAST_FREE_DEATH) status = "protégé";
  } else if (b.publishedYear != null ? b.publishedYear > LAST_SAFE_PUBLICATION : STRICT) {
    status = "à vérifier";
  }
  if (status) rows.push({ ...b, death, status });
}

const prot = rows.filter((r) => r.status === "protégé");
const check = rows.filter((r) => r.status === "à vérifier");
console.log(`Livres publiés : ${books.length}`);
console.log(`Limite UE : auteur mort en ${LAST_FREE_DEATH} ou avant`);
console.log(`  protégé    : ${prot.length}`);
console.log(`  à vérifier : ${check.length}`);
for (const r of [...prot, ...check].slice(0, 40))
  console.log(`  [${r.status}] ${r.title} — ${r.author} (décès ${r.death ?? "?"}, publié ${r.publishedYear ?? "?"})`);
if (rows.length > 40) console.log(`  … ${rows.length - 40} autres dans copyright-audit.csv`);

const csv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
writeFileSync(
  "copyright-audit.csv",
  ["statut,titre,auteur,deces,publication,slug,id"]
    .concat(rows.map((r) => [r.status, r.title, r.author, r.death, r.publishedYear, r.slug, r.id].map(csv).join(",")))
    .join("\n") + "\n"
);
console.log("Liste complète : copyright-audit.csv");

if (APPLY) {
  const ids = (UNKNOWN ? rows : prot).map((r) => r.id);
  const res = await prisma.book.updateMany({ where: { id: { in: ids } }, data: { isPublished: false } });
  console.log(`✓ ${res.count} livre(s) dépublié(s) (isPublished=false). Rétablir : remettre isPublished à true via l'admin ou les id du CSV.`);
} else {
  console.log("Aperçu seulement. Ajouter --apply pour dépublier.");
}
await prisma.$disconnect();
