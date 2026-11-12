/**
 * Allège le disque : remplace les PDF stockés localement par un LIEN direct vers
 * Internet Archive (où ils sont déjà hébergés — chaque livre a son `sourceId`).
 * Le lecteur en ligne passe par le proxy /livre/[slug]/pdf (pas de CORS requis),
 * le téléchargement redirige vers archive.org. Modèle identique à l'EPUB/audio.
 *
 *   node --env-file=.env scripts/pdf-to-archive.mjs            # DRY-RUN (défaut)
 *   node --env-file=.env scripts/pdf-to-archive.mjs --apply    # applique + supprime les PDF locaux
 *
 * Sûr : un PDF local n'est supprimé QUE si une URL archive.org valide (HTTP 200)
 * a été trouvée et enregistrée. Les livres sans correspondance gardent leur PDF.
 * Relançable (ignore les PDF déjà externes).
 */
import { PrismaClient } from "@prisma/client";
import { unlink, stat } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const UA = "livrespdfgratuits.com (pdf-to-archive)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// Choisit le meilleur PDF d'un item archive.org : on préfère l'original
// (sans suffixe _text/_bw, généralement plus léger) ; sinon n'importe quel PDF.
function pickPdf(files) {
  const pdfs = files.filter((f) => /\.pdf$/i.test(f.name));
  if (!pdfs.length) return null;
  const original = pdfs.find((f) => !/_(text|bw|djvu)\.pdf$/i.test(f.name));
  return original || pdfs[0];
}

async function headOk(url) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow", headers: { "User-Agent": UA } });
    return r.ok;
  } catch {
    return false;
  }
}

async function main() {
  const books = await prisma.book.findMany({
    where: {
      mediaType: "PDF",
      sourceId: { not: null },
      pdfUrl: { startsWith: "/" }, // uniquement les PDF encore locaux
    },
    select: { id: true, title: true, sourceId: true, pdfUrl: true },
  });
  console.log(`${books.length} livre(s) à migrer vers archive.org${APPLY ? " (APPLY)" : " (DRY-RUN)"}\n`);

  let migrated = 0,
    skipped = 0,
    freedBytes = 0;

  for (const b of books) {
    let meta;
    try {
      meta = await fetchJson(`https://archive.org/metadata/${b.sourceId}`);
    } catch {
      console.log(`⚠  SKIP "${b.title.slice(0, 48)}" — métadonnées archive.org inaccessibles`);
      skipped++;
      await sleep(250);
      continue;
    }
    const file = pickPdf(meta?.files ?? []);
    if (!file) {
      console.log(`⚠  SKIP "${b.title.slice(0, 48)}" — aucun PDF sur archive.org`);
      skipped++;
      await sleep(250);
      continue;
    }
    const archiveUrl = `https://archive.org/download/${b.sourceId}/${encodeURIComponent(file.name)}`;
    if (!(await headOk(archiveUrl))) {
      console.log(`⚠  SKIP "${b.title.slice(0, 48)}" — URL archive non résolue`);
      skipped++;
      await sleep(250);
      continue;
    }

    const localPath = path.join(process.cwd(), "public", b.pdfUrl.replace(/^\/+/, ""));
    let localSize = 0;
    try {
      localSize = (await stat(localPath)).size;
    } catch {
      /* fichier déjà absent */
    }
    const remoteSize = Number(file.size) || null;

    console.log(
      `✓ "${b.title.slice(0, 44)}" → ${archiveUrl.slice(0, 70)}…  (local ${(localSize / 1048576).toFixed(1)} Mo)`
    );

    if (APPLY) {
      await prisma.book.update({
        where: { id: b.id },
        data: { pdfUrl: archiveUrl, ...(remoteSize ? { pdfSize: remoteSize } : {}) },
      });
      if (localSize) {
        try {
          await unlink(localPath);
          freedBytes += localSize;
        } catch {
          /* non bloquant */
        }
      }
    } else {
      freedBytes += localSize;
    }
    migrated++;
    await sleep(300);
  }

  console.log(
    `\n${APPLY ? "Migrés" : "Migrables"} : ${migrated} · Ignorés : ${skipped} · ` +
      `Disque ${APPLY ? "libéré" : "libérable"} : ${(freedBytes / 1073741824).toFixed(2)} Go`
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
