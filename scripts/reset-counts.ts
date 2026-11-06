/**
 * Remet à zéro les compteurs de téléchargements et de vues de tous les livres,
 * et vide le journal des téléchargements. À lancer une fois pour repartir sur
 * des statistiques 100% réelles.
 *
 * Lancer : ./node_modules/.bin/tsx scripts/reset-counts.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const removed = await prisma.download.deleteMany();
  const updated = await prisma.book.updateMany({
    data: { downloadCount: 0, viewCount: 0 },
  });
  console.log(
    `✅ ${updated.count} livre(s) remis à zéro, ${removed.count} ligne(s) de journal supprimée(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
