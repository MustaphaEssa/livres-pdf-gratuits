/**
 * Images des articles déjà publiés : couverture + images dans le texte.
 * Vraies images de Wikimedia Commons (domaine public ou licence libre), téléchargées
 * et hébergées sur le site (public/uploads/blog), crédit ajouté automatiquement
 * (auteur, licence, lien) — voir scripts/blog/commons.mjs.
 *
 *   node scripts/set-blog-covers.mjs            # aperçu
 *   node scripts/set-blog-covers.mjs --apply    # applique
 *
 * Relançable : une couverture existante n'est jamais remplacée ; une image déjà
 * insérée dans le texte (même numéro) n'est pas ajoutée deux fois.
 */
import { PrismaClient } from "@prisma/client";
import { commonsImage, coverCreditLine } from "./blog/commons.mjs";
import { PLAN } from "./blog/image-plan.mjs";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const blocksOf = (s) => s.replace(/\r\n/g, "\n").split(/\n\s*\n/);

const posts = await prisma.post.findMany({
  where: { slug: { in: Object.keys(PLAN) } },
  select: { id: true, slug: true, coverImage: true, content: true, language: true },
});

for (const p of posts) {
  const plan = PLAN[p.slug];
  const lang = p.language === "en" ? "en" : "fr";
  let content = p.content;
  let coverImage = p.coverImage;
  const changes = [];

  if (plan.cover && !coverImage) {
    const img = APPLY ? await commonsImage(plan.cover, `${p.slug}-cover`, lang) : { url: "(aperçu)", credit: "" };
    if (img) {
      coverImage = img.url;
      if (APPLY) content = `${content.trimEnd()}\n\n${coverCreditLine(img.credit, lang)}`;
      changes.push("couverture");
    }
  }

  // Numéro fixe par image ; positions numériques traitées de la dernière à la première
  // (une insertion décale les numéros des blocs suivants).
  const items = (plan.inline ?? [])
    .map((item, i) => ({ ...item, n: i + 1 }))
    .sort((x, y) => (typeof y.after === "number" ? y.after : -1) - (typeof x.after === "number" ? x.after : -1));
  for (const item of items) {
    const n = item.n;
    const marker = `/uploads/blog/${p.slug}-in-${n}.`;
    if (content.includes(marker)) continue;
    const blocks = blocksOf(content);
    const idx =
      typeof item.after === "number" ? item.after : blocks.findIndex((b) => b.trim().startsWith(item.after));
    if (idx < 0 || idx >= blocks.length) {
      console.warn(`  ${p.slug} : emplacement introuvable (${item.after})`);
      continue;
    }
    if (!APPLY) {
      changes.push(`image ${n}`);
      continue;
    }
    const img = await commonsImage(item.file, `${p.slug}-in-${n}`, lang);
    if (!img) continue;
    const label = lang === "fr" ? "Image : " : "Image: ";
    blocks.splice(idx + 1, 0, `![${item.alt}](${img.url} "${item.caption} — ${label}${img.credit}")`);
    content = blocks.join("\n\n");
    changes.push(`image ${n}`);
  }

  if (!changes.length) {
    console.log(`= ${p.slug} : rien à faire`);
    continue;
  }
  if (APPLY) await prisma.post.update({ where: { id: p.id }, data: { coverImage, content } });
  console.log(`${APPLY ? "✓" : "→"} ${p.slug} : ${changes.join(", ")}`);
}
if (!APPLY) console.log("Aperçu seulement. Ajouter --apply.");
await prisma.$disconnect();
