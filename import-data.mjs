// Import des données exportées (data-export.json) dans la base PostgreSQL du VPS.
// À lancer sur le VPS :  node import-data.mjs
// Garde intact le compte admin et les SiteSettings déjà configurés sur le VPS.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const p = new PrismaClient();
const d = JSON.parse(readFileSync("data-export.json", "utf8"));

// Slug auteur (même logique que src/lib/utils.ts)
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Nettoyage des tables de contenu (démo)…");
  await p.bookCategory.deleteMany();
  await p.postCategory.deleteMany();
  await p.comment.deleteMany();
  await p.review.deleteMany();
  await p.download.deleteMany();
  await p.favorite.deleteMany();
  await p.book.deleteMany();
  await p.post.deleteMany();
  await p.category.deleteMany();

  console.log("Import des données locales…");
  if (d.Category?.length) await p.category.createMany({ data: d.Category });
  if (d.Book?.length) {
    // Calcule authorSlug (absent de l'ancienne base SQLite)
    const books = d.Book.map((b) => ({
      ...b,
      authorSlug: b.author ? slugify(b.author) : null,
    }));
    await p.book.createMany({ data: books });
  }
  if (d.BookCategory?.length) await p.bookCategory.createMany({ data: d.BookCategory });
  if (d.Post?.length) await p.post.createMany({ data: d.Post });
  if (d.PostCategory?.length) await p.postCategory.createMany({ data: d.PostCategory });
  if (d.Review?.length) await p.review.createMany({ data: d.Review });
  if (d.Download?.length) {
    // On remet userId à null (aucun utilisateur importé)
    await p.download.createMany({ data: d.Download.map((x) => ({ ...x, userId: null })) });
  }

  const [books, cats, posts] = await Promise.all([
    p.book.count(),
    p.category.count(),
    p.post.count(),
  ]);
  console.log(`\nTerminé ✅  livres=${books}, catégories=${cats}, articles=${posts}`);
}

main()
  .catch((e) => {
    console.error("Échec de l'import :", e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
