// Crée des collections thématiques à partir du catalogue existant.
// Idempotent : une collection dont le slug existe déjà est ignorée.
// Usage :  node --env-file=.env scripts/seed-collections.mjs
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

// --- Définition des collections -------------------------------------------
// category: slug de catégorie (ou null pour piocher dans tout le catalogue)
const COLLECTIONS = [
  {
    slug: "a-lire-absolument",
    title: "À lire absolument",
    description:
      "Nos livres les plus consultés, tous genres confondus — une porte d'entrée idéale dans le domaine public.",
    category: null,
    count: 6,
  },
  {
    slug: "grands-romans-classiques",
    title: "Grands romans classiques",
    description:
      "Les grandes œuvres de fiction à (re)découvrir : des récits qui ont traversé les siècles.",
    category: "romans",
    count: 6,
  },
  {
    slug: "s-initier-a-la-philosophie",
    title: "S'initier à la philosophie",
    description:
      "Des textes fondateurs pour penser par soi-même, des Anciens aux philosophes des Lumières.",
    category: "philosophie",
    count: 6,
  },
  {
    slug: "au-fil-de-l-histoire",
    title: "Au fil de l'Histoire",
    description:
      "Chroniques, mémoires et grandes études pour comprendre le passé à travers ceux qui l'ont écrit.",
    category: "histoire",
    count: 6,
  },
  {
    slug: "le-gout-de-la-poesie",
    title: "Le goût de la poésie",
    description:
      "Recueils et anthologies à savourer vers à vers — la langue à l'état pur.",
    category: "poesie",
    count: 6,
  },
  {
    slug: "sciences-et-decouvertes",
    title: "Sciences & découvertes",
    description:
      "L'esprit de curiosité au fil des pages : la nature, le monde et le savoir expliqués.",
    category: "sciences",
    count: 6,
  },
];

// --- Helpers ---------------------------------------------------------------
// Repli propre et varié (par position) quand la description n'est pas exploitable.
const FALLBACKS = [
  "Une œuvre du domaine public, libre à lire, à télécharger et à partager.",
  "Un texte patrimonial à (re)découvrir, gratuitement et sans compte.",
  "Un classique accessible à tous, en lecture en ligne comme en PDF.",
  "À redécouvrir : un ouvrage du domaine public, entièrement gratuit.",
  "Un titre de la bibliothèque libre, à lire à votre rythme.",
  "Une lecture du domaine public, offerte à tous les curieux.",
];

// Détecte les descriptions qui ne sont que des métadonnées de catalogue.
function isCatalogJunk(d) {
  return (
    /biblioth[eè]que interuniversitaire|available at|microfiche|reproduction|photocopie|\[from old catalog\]|pleine page|planche|^pl\.|^première section|^reprod\b/i.test(
      d
    ) || /^[\s\p{P}\d]+$/u.test(d)
  );
}

function makeNote(book, index) {
  const d = (book.description || "").trim().replace(/\s+/g, " ");
  if (d.length >= 60 && !isCatalogJunk(d)) {
    // Première phrase, sinon ~180 premiers caractères (coupe sur un mot).
    const firstSentence = d.match(/^.{60,180}?[.!?](\s|$)/);
    if (firstSentence) return firstSentence[0].trim();
    if (d.length <= 190) return d;
    return d.slice(0, 180).replace(/\s+\S*$/, "") + "…";
  }
  return FALLBACKS[index % FALLBACKS.length];
}

async function topBooks(categorySlug, count) {
  return p.book.findMany({
    where: {
      isPublished: true,
      ...(categorySlug
        ? { categories: { some: { category: { slug: categorySlug } } } }
        : {}),
    },
    orderBy: [{ downloadCount: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
    take: count,
    select: {
      id: true,
      title: true,
      description: true,
      categories: { select: { category: { select: { name: true } } } },
    },
  });
}

// --- Exécution -------------------------------------------------------------
async function main() {
  let created = 0;
  let skipped = 0;
  for (const def of COLLECTIONS) {
    const exists = await p.collection.count({ where: { slug: def.slug } });
    if (exists) {
      console.log(`⏭  ${def.slug} — existe déjà, ignorée`);
      skipped++;
      continue;
    }
    const books = await topBooks(def.category, def.count);
    if (books.length === 0) {
      console.log(`⚠  ${def.slug} — aucun livre trouvé, ignorée`);
      skipped++;
      continue;
    }
    const col = await p.collection.create({
      data: {
        slug: def.slug,
        title: def.title,
        description: def.description,
        isPublished: true,
        books: {
          create: books.map((b, i) => ({
            bookId: b.id,
            order: i,
            note: makeNote(b, i),
          })),
        },
      },
    });
    console.log(`✅ ${col.slug} — ${books.length} livres`);
    created++;
  }
  console.log(`\nTerminé : ${created} créée(s), ${skipped} ignorée(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
