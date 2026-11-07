/**
 * Nettoie les fausses couvertures : le service d'image d'Internet Archive
 * renvoyait un placeholder générique (archive.org/images/notfound.png, ~2 Ko,
 * un PNG) pour les livres sans vraie couverture. L'ancien import l'enregistrait
 * comme « couverture » (souvent en .jpg). Ce script détecte ces placeholders,
 * supprime le fichier et remet coverImage à null → la page affiche son visuel
 * de repli (initiale du titre).
 *
 * Lancer : ./node_modules/.bin/tsx scripts/clean-placeholder-covers.ts
 * Relançable sans risque.
 */
import { PrismaClient } from "@prisma/client";
import { readFile, unlink, stat } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const PUBLIC = path.join(process.cwd(), "public");

// Vrai = ce fichier est le placeholder "notfound" d'Internet Archive
// (PNG, poids très faible). Les vraies couvertures sont des JPEG plus lourds.
function isPlaceholder(buf: Buffer): boolean {
  const isPng =
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47;
  // notfound.png fait ~2212 octets ; on garde une marge mais on reste petit
  return isPng && buf.length < 5000;
}

async function main() {
  const books = await prisma.book.findMany({
    where: { coverImage: { not: null } },
    select: { id: true, slug: true, title: true, coverImage: true },
  });
  console.log(`${books.length} livre(s) avec couverture à vérifier…`);

  let cleaned = 0;
  for (const b of books) {
    const rel = b.coverImage!;
    const abs = path.join(PUBLIC, rel.replace(/^\//, ""));
    try {
      await stat(abs);
    } catch {
      // Fichier manquant → coverImage orpheline : on remet à null
      await prisma.book.update({ where: { id: b.id }, data: { coverImage: null } });
      console.log(`✗ Fichier absent → null : ${b.title}`);
      cleaned++;
      continue;
    }
    const buf = await readFile(abs);
    if (isPlaceholder(buf)) {
      await unlink(abs).catch(() => {});
      await prisma.book.update({ where: { id: b.id }, data: { coverImage: null } });
      console.log(`🧹 Placeholder retiré : ${b.title}`);
      cleaned++;
    }
  }

  console.log(`\nTerminé : ${cleaned} fausse(s) couverture(s) nettoyée(s).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
