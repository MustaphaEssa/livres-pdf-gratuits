/**
 * Supprime les livres en DOUBLON : même auteur + même titre (Internet Archive
 * contient souvent plusieurs scans/éditions d'une même œuvre). Pour chaque
 * groupe de doublons, garde UN exemplaire (le meilleur) et supprime les autres,
 * y compris leurs fichiers PDF/couverture locaux.
 *
 *   node scripts/dedup-books.mjs            # DRY-RUN : montre sans supprimer
 *   node scripts/dedup-books.mjs --apply    # supprime réellement
 *
 * « Meilleur » exemplaire gardé : celui qui a une version audio, puis un EPUB,
 * puis le plus de téléchargements, puis le PDF le plus léger.
 * Les tomes différents (tome 1, tome 2…) ne sont PAS fusionnés.
 */
import { PrismaClient } from "@prisma/client";
import { unlink } from "fs/promises";
import path from "path";
const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");

function norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Score : plus haut = on garde
function score(b) {
  return (
    (b.audioTracks ? 1_000_000_000 : 0) +
    (b.epubUrl ? 100_000_000 : 0) +
    (b.downloadCount || 0) * 1000 +
    // PDF plus léger = mieux (on soustrait la taille en Ko, bornée)
    Math.max(0, 50_000 - Math.round((b.pdfSize || 0) / 1024))
  );
}

async function removeFile(url) {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", url.replace(/^\/+/, "")));
  } catch {
    /* fichier déjà absent */
  }
}

async function main() {
  const books = await prisma.book.findMany({
    where: { authorSlug: { not: null } },
    select: {
      id: true, slug: true, title: true, author: true, authorSlug: true,
      mediaType: true, epubUrl: true, audioTracks: true, downloadCount: true,
      pdfSize: true, pdfUrl: true, coverImage: true,
    },
  });

  // Regroupe par auteur + titre normalisé
  const groups = new Map();
  for (const b of books) {
    const key = `${b.authorSlug}::${norm(b.title)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }

  let dupGroups = 0;
  let toDelete = 0;
  const deletions = [];

  for (const [, arr] of groups) {
    if (arr.length < 2) continue;
    dupGroups++;
    arr.sort((a, b) => score(b) - score(a)); // meilleur en premier
    const keep = arr[0];
    const remove = arr.slice(1);
    toDelete += remove.length;
    console.log(
      `• "${keep.title.slice(0, 45)}" (${keep.author}) : ${arr.length} exemplaires → on garde 1, on supprime ${remove.length}`
    );
    deletions.push(...remove);
  }

  console.log(
    `\n${dupGroups} groupe(s) de doublons · ${toDelete} livre(s) à supprimer sur ${books.length}.${APPLY ? "" : "  (DRY-RUN — ajoutez --apply pour supprimer)"}`
  );

  if (APPLY && deletions.length) {
    for (const b of deletions) {
      await removeFile(b.pdfUrl);
      await removeFile(b.coverImage);
      await prisma.book.delete({ where: { id: b.id } }).catch(() => {});
    }
    console.log(`✅ ${deletions.length} doublon(s) supprimé(s).`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
