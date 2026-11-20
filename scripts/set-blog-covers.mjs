/**
 * Ajoute une vraie image de couverture (Wikimedia Commons, domaine public ou licence
 * libre) aux articles déjà publiés qui n'en ont pas, avec la ligne de crédit en fin
 * d'article. L'image est téléchargée et hébergée sur le site (public/uploads/blog).
 *
 *   node scripts/set-blog-covers.mjs            # aperçu
 *   node scripts/set-blog-covers.mjs --apply    # applique
 *
 * Relançable : ne touche jamais un article qui a déjà une couverture.
 */
import { PrismaClient } from "@prisma/client";
import { commonsImage, coverCreditLine } from "./blog/commons.mjs";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const COVERS = {
  // FR
  "par-ou-commencer-zola-rougon-macquart":
    "File:The mining village illustration from Germinal by Emile Zola（Drawing by Jules Férat）.jpg",
  "jules-verne-par-quel-roman-commencer": "File:'Twenty Thousand Leagues Under the Sea' by Neuville and Riou 027.jpg",
  "classiques-lycee-lire-gratuitement-pdf": "File:Œuvres de Molière. Volume 4. LDUT411(4).jpg",
  "livres-audio-gratuits-francais-ou-ecouter": "File:Old books - old textures.jpg",
  "victor-hugo-oeuvres-essentielles-a-lire": "File:Victor Hugo by Étienne Carjat 1876 - full.jpg",
  // EN
  "is-quasimodo-real-hunchback-of-notre-dame": "File:Hugo - Notre-Dame de Paris, 1844 p0274.png",
  "les-miserables-reading-guide-five-volumes": "File:Cosette-sweeping-les-miserables-emile-bayard-1862.jpg",
  "public-domain-day-2027-what-becomes-free": "File:Old Geodesy library books.jpg",
  "free-christmas-stories-public-domain": "File:Mr Fezziwig's Ball - A Christmas Carol (1843), frontispiece - BL.jpg",
  "free-classic-audiobooks-public-domain-guide": "File:Old books - old textures.jpg",
};

const posts = await prisma.post.findMany({
  where: { slug: { in: Object.keys(COVERS) } },
  select: { id: true, slug: true, coverImage: true, content: true, language: true },
});

for (const p of posts) {
  if (p.coverImage) {
    console.log(`= ${p.slug} : a déjà une couverture`);
    continue;
  }
  if (!APPLY) {
    console.log(`→ ${p.slug} : ${COVERS[p.slug]}`);
    continue;
  }
  const lang = p.language === "en" ? "en" : "fr";
  const img = await commonsImage(COVERS[p.slug], `${p.slug}-cover`, lang);
  if (!img) continue;
  const line = coverCreditLine(img.credit, lang);
  await prisma.post.update({
    where: { id: p.id },
    data: {
      coverImage: img.url,
      content: p.content.includes(line) ? p.content : `${p.content.trimEnd()}\n\n${line}`,
    },
  });
  console.log(`✓ ${p.slug} → ${img.url}`);
}
if (!APPLY) console.log("Aperçu seulement. Ajouter --apply.");
await prisma.$disconnect();
