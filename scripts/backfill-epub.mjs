/**
 * Renseigne le lien EPUB (depuis Internet Archive) des livres PDF déjà importés.
 *
 *   node scripts/backfill-epub.mjs
 *
 * Pour chaque livre PDF ayant un sourceId mais pas encore d'epubUrl, interroge
 * Internet Archive et, s'il existe un fichier .epub, enregistre son URL directe
 * (rien n'est téléchargé). Relançable sans risque (ignore ceux déjà renseignés).
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const UA = "livrespdfgratuits.com (backfill-epub)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const books = await prisma.book.findMany({
    where: { mediaType: "PDF", sourceId: { not: null }, epubUrl: null },
    select: { id: true, slug: true, sourceId: true },
  });
  console.log(`${books.length} livre(s) à vérifier…`);

  let found = 0;
  let i = 0;
  for (const b of books) {
    i++;
    try {
      const res = await fetch(`https://archive.org/metadata/${b.sourceId}`, {
        headers: { "User-Agent": UA },
      });
      if (res.ok) {
        const meta = await res.json();
        const files = meta?.files ?? [];
        const epub = files.find((f) => /\.epub$/i.test(f.name));
        if (epub) {
          const url = `https://archive.org/download/${b.sourceId}/${encodeURIComponent(epub.name)}`;
          await prisma.book.update({ where: { id: b.id }, data: { epubUrl: url } });
          found++;
          console.log(`✓ [${i}/${books.length}] ${b.slug} → EPUB`);
        }
      }
    } catch {
      /* on ignore et on continue */
    }
    await sleep(300); // courtoisie envers Internet Archive
  }

  console.log(`\nTerminé : ${found} EPUB ajouté(s) sur ${books.length} livre(s).`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
