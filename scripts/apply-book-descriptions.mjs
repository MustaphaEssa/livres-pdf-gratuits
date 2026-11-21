/**
 * Applique un lot de descriptions éditoriales (scripts/book-descriptions/batch-XX.mjs).
 *
 *   node scripts/apply-book-descriptions.mjs batch-01            # aperçu
 *   node scripts/apply-book-descriptions.mjs batch-01 --apply    # applique
 *
 * - Sauvegarde l'ancienne description et sa source dans
 *   /home/vcp/desc-backup-<lot>.json (ou ./desc-backup-<lot>.json) avant toute écriture.
 * - descriptionSource = « editorial » (+ « |<URL Wikipédia> » si un résumé Wikipédia
 *   existait, pour que le calcul de popularité garde ses vues) : fetch-book-summaries et
 *   reject-bad-summaries ignorent ces fiches, aucun lien d'attribution n'est affiché.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, existsSync } from "node:fs";

const batch = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!batch || batch.startsWith("--")) {
  console.error("Usage : node scripts/apply-book-descriptions.mjs batch-01 [--apply]");
  process.exit(1);
}
const { descriptions } = await import(`./book-descriptions/${batch}.mjs`);
const prisma = new PrismaClient();

const books = await prisma.book.findMany({
  where: { slug: { in: descriptions.map((d) => d.slug) } },
  select: { id: true, slug: true, title: true, description: true, descriptionSource: true },
});
const bySlug = new Map(books.map((b) => [b.slug, b]));
const missing = descriptions.filter((d) => !bySlug.has(d.slug)).map((d) => d.slug);
if (missing.length) console.warn("Fiches introuvables (ignorées) :", missing.join(", "));

const backupPath = existsSync("/home/vcp") ? `/home/vcp/desc-backup-${batch}.json` : `./desc-backup-${batch}.json`;
if (APPLY && !existsSync(backupPath)) {
  writeFileSync(
    backupPath,
    JSON.stringify(books.map(({ slug, description, descriptionSource }) => ({ slug, description, descriptionSource })), null, 2)
  );
  console.log(`Sauvegarde : ${backupPath}`);
}

let n = 0;
for (const d of descriptions) {
  const b = bySlug.get(d.slug);
  if (!b) continue;
  const wiki = b.descriptionSource?.match(/https?:\/\/\S+/)?.[0];
  const source = wiki ? `editorial|${wiki}` : "editorial";
  console.log(`${APPLY ? "✓" : "→"} ${b.title.slice(0, 60)}  (${d.text.split(/\s+/).length} mots)`);
  if (APPLY) await prisma.book.update({ where: { id: b.id }, data: { description: d.text.trim(), descriptionSource: source } });
  n++;
}
console.log(`${n} description(s) ${APPLY ? "appliquée(s)" : "à appliquer (aperçu)"}.`);
await prisma.$disconnect();
