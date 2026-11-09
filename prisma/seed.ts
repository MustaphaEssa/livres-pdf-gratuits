import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Identifiants admin par défaut (surchargeables via ADMIN_EMAIL / ADMIN_PASSWORD)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@livrespdfgratuits.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Catégories de livres
const categories = [
  { name: "Romans", slug: "romans" },
  { name: "Sciences", slug: "sciences" },
  { name: "Histoire", slug: "histoire" },
  { name: "Informatique", slug: "informatique" },
  { name: "Religion", slug: "religion" },
  { name: "Philosophie", slug: "philosophie" },
  { name: "Poésie", slug: "poesie" },
  { name: "Biographies", slug: "biographies" },
];

// Catégories de blog
const blogCategories = [
  { name: "Actualités", slug: "actualites" },
  { name: "Tutoriels", slug: "tutoriels" },
  { name: "Culture", slug: "culture" },
];

// Articles de blog d'exemple
const posts = [
  {
    slug: "top-10-romans-classiques-a-lire",
    title: "Top 10 des romans classiques à lire absolument",
    excerpt:
      "Une sélection intemporelle de chefs-d'œuvre de la littérature, tous disponibles gratuitement en PDF sur notre bibliothèque.",
    author: "Équipe éditoriale",
    categorySlug: "culture",
    isFeatured: true,
    content: `La littérature classique traverse les époques sans prendre une ride. Voici notre sélection de dix romans incontournables, à découvrir ou redécouvrir.

Ces œuvres, aujourd'hui dans le domaine public, ont façonné la culture mondiale. Elles abordent des thèmes universels : l'amour, la justice, la condition humaine, la quête de sens.

Que vous soyez amateur de grands récits ou simplement curieux, chacun de ces titres mérite une place dans votre bibliothèque numérique. Bonne lecture !`,
  },
  {
    slug: "comment-telecharger-lire-livre-pdf",
    title: "Comment télécharger et lire un livre PDF",
    excerpt:
      "Guide étape par étape pour télécharger vos livres et les lire directement en ligne, sur ordinateur, tablette ou mobile.",
    author: "Support technique",
    categorySlug: "tutoriels",
    isFeatured: false,
    content: `Télécharger un livre sur notre plateforme est simple et gratuit. Rendez-vous sur la fiche d'un livre, puis cliquez sur le bouton « Télécharger PDF ».

Vous pouvez aussi lire le livre directement dans votre navigateur grâce au bouton « Lire en ligne », sans rien installer. Notre lecteur intégré vous permet de tourner les pages et de zoomer.

Sur mobile, le téléchargement enregistre le fichier dans vos documents. Vous pourrez le lire hors connexion avec n'importe quelle application PDF.`,
  },
  {
    slug: "histoire-du-livre-numerique",
    title: "L'histoire fascinante du livre numérique",
    excerpt:
      "Du Projet Gutenberg aux liseuses modernes : retour sur l'évolution du livre électronique et son impact sur la lecture.",
    author: "Rédaction",
    categorySlug: "culture",
    isFeatured: true,
    content: `Le livre numérique n'est pas une invention récente. Dès 1971, le Projet Gutenberg numérisait ses premiers textes du domaine public, posant les bases de la bibliothèque numérique mondiale.

Avec l'arrivée des liseuses à encre électronique dans les années 2000, la lecture numérique est devenue confortable et accessible à tous. Aujourd'hui, des millions d'ouvrages sont disponibles en quelques clics.

Notre mission s'inscrit dans cette histoire : rendre la connaissance libre et accessible, gratuitement, pour tous les lecteurs francophones.`,
  },
];

async function main() {
  // Admin (mot de passe hashé avec bcrypt)
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hashedPassword },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: "Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log("Admin créé/mis à jour:", admin.email);

  // Catégories
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name, type: "BOOK" },
    });
  }
  console.log(`${categories.length} catégories créées`);

  // Catégories de blog
  for (const cat of blogCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, type: "BLOG" },
      create: { slug: cat.slug, name: cat.name, type: "BLOG" },
    });
  }

  // Articles de blog
  for (const { categorySlug, ...post } of posts) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    const created = await prisma.post.upsert({
      where: { slug: post.slug },
      update: { ...post, isPublished: true },
      create: { ...post, isPublished: true, publishedAt: new Date() },
    });
    if (category) {
      await prisma.postCategory.upsert({
        where: {
          postId_categoryId: { postId: created.id, categoryId: category.id },
        },
        update: {},
        create: { postId: created.id, categoryId: category.id },
      });
    }
  }
  console.log(`${posts.length} articles de blog créés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
