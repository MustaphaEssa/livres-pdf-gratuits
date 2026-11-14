/**
 * Remplit Author.bioI18n : la bio de chaque auteur dans les 11 langues du site
 * hors français, tirée de l'article Wikipédia de chaque langue (même personne,
 * retrouvée via les liens interlangues de l'article FR, sinon EN).
 *
 * Lancer :  ./node_modules/.bin/tsx scripts/translate-author-bios.ts
 * Options : --all       retraite aussi les auteurs déjà traduits
 *           --limit=50  ne traite que N auteurs
 *
 * Ne traite que les auteurs ayant déjà une bio FR (bonne personne trouvée).
 * Relançable : par défaut, ne traite que les auteurs sans bioI18n.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { fetchBioTranslations } from "../src/lib/author-bios";

const prisma = new PrismaClient();
const ALL = process.argv.includes("--all");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1]) || undefined;
const CONCURRENCY = 1; // Wikipédia limite le débit (429) au-delà
// Auteurs génériques : pas d'article Wikipédia pertinent
const GENERIC = /^(auteur inconnu|inconnu|anonyme|anonymous|unknown|various|divers)$/i;

async function main() {
  const authors = await prisma.author.findMany({
    // Seulement les auteurs qui ont déjà une bio FR : la même recherche Wikipédia
    // a donc trouvé la bonne personne (évite les homonymes).
    where: { bio: { not: null }, ...(ALL ? {} : { bioI18n: { equals: Prisma.DbNull } }) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: LIMIT,
  });
  const todo = authors.filter((a) => !GENERIC.test(a.name.trim()));
  console.log(`${todo.length} auteur(s) à traiter`);

  let done = 0;
  let found = 0;
  const queue = [...todo];
  async function worker() {
    for (let a = queue.shift(); a; a = queue.shift()) {
      let bios;
      try {
        bios = await fetchBioTranslations(a.name);
      } catch (e) {
        // Wikipédia n'a pas répondu : on n'enregistre rien, l'auteur sera repris au prochain passage
        done++;
        console.warn(`[${done}/${todo.length}] ${a.name} — ignoré (${e instanceof Error ? e.message : e})`);
        continue;
      }
      const n = Object.keys(bios).length;
      // {} enregistré aussi : marque l'auteur comme traité (pas de nouvel essai sans --all)
      await prisma.author.update({ where: { id: a.id }, data: { bioI18n: bios } });
      done++;
      if (n) found++;
      console.log(`[${done}/${todo.length}] ${a.name} — ${n ? Object.keys(bios).join(", ") : "aucune traduction"}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`✅ Terminé : ${found}/${todo.length} auteurs avec au moins une bio traduite.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
