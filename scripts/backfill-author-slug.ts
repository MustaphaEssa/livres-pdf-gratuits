/**
 * Renseigne authorSlug pour les livres qui ne l'ont pas encore.
 * À lancer une fois après l'ajout du champ : ./node_modules/.bin/tsx scripts/backfill-author-slug.ts
 */
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const books = await prisma.book.findMany({
    where: { OR: [{ authorSlug: null }, { authorSlug: "" }] },
    select: { id: true, author: true },
  });
  console.log(`${books.length} livre(s) à mettre à jour…`);

  let done = 0;
  for (const b of books) {
    await prisma.book.update({
      where: { id: b.id },
      data: { authorSlug: slugify(b.author) },
    });
    done++;
  }
  console.log(`✅ ${done} authorSlug renseignés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
