/**
 * Compresse les PDF stockés localement (scans lourds) via Ghostscript, pour
 * alléger le disque du VPS. Les livres déjà servis depuis archive.org (pdfUrl
 * externe) ne sont PAS concernés.
 *
 *   node --env-file=.env scripts/compress-pdfs.mjs            # DRY-RUN (défaut)
 *   node --env-file=.env scripts/compress-pdfs.mjs --apply    # compresse réellement
 *
 * Prérequis : Ghostscript installé (VPS : `sudo apt install ghostscript`).
 * Réglage par défaut : /ebook (~150 dpi, bon compromis lisibilité/poids).
 *   QUALITY=screen  -> plus petit, qualité moindre (~72 dpi)
 *   QUALITY=printer -> plus gros, meilleure qualité (~300 dpi)
 *   MIN_MB=2        -> ignore les PDF plus petits que ça (défaut 2 Mo)
 *
 * Sûr : compresse vers un fichier temporaire, ne remplace l'original QUE si le
 * résultat est un PDF valide ET plus léger. Met à jour pdfSize en base.
 * Relançable (un PDF déjà compressé ne regagnera presque rien, il est conservé).
 */
import { PrismaClient } from "@prisma/client";
import { stat, rename, unlink } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import os from "os";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const QUALITY = process.env.QUALITY || "ebook"; // screen | ebook | printer
const MIN_BYTES = (Number(process.env.MIN_MB) || 2) * 1024 * 1024;

// Binaire Ghostscript : `gs` sous Linux/mac, `gswin64c`/`gswin32c` sous Windows.
const GS_BIN = process.env.GS_BIN || (os.platform() === "win32" ? "gswin64c" : "gs");

function gs(args) {
  return new Promise((resolve) => {
    const p = spawn(GS_BIN, args, { stdio: "ignore" });
    p.on("error", () => resolve(false)); // binaire introuvable
    p.on("close", (code) => resolve(code === 0));
  });
}

async function main() {
  const books = await prisma.book.findMany({
    where: { mediaType: "PDF", pdfUrl: { startsWith: "/" } },
    select: { id: true, title: true, pdfUrl: true },
  });

  // Vérifie la présence de Ghostscript (en --apply seulement).
  if (APPLY) {
    const ok = await gs(["--version"]);
    if (!ok) {
      console.error(
        `✗ Ghostscript introuvable (commande "${GS_BIN}"). Installe-le : sudo apt install ghostscript`
      );
      process.exit(1);
    }
  }

  console.log(
    `${books.length} PDF locaux · qualité /${QUALITY} · seuil ${(MIN_BYTES / 1048576).toFixed(0)} Mo${
      APPLY ? " (APPLY)" : " (DRY-RUN)"
    }\n`
  );

  let done = 0,
    skipped = 0,
    before = 0,
    after = 0;

  for (const b of books) {
    const abs = path.join(process.cwd(), "public", b.pdfUrl.replace(/^\/+/, ""));
    let size = 0;
    try {
      size = (await stat(abs)).size;
    } catch {
      console.log(`⚠  SKIP "${b.title.slice(0, 44)}" — fichier absent`);
      skipped++;
      continue;
    }
    if (size < MIN_BYTES) {
      skipped++;
      continue;
    }
    before += size;

    if (!APPLY) {
      console.log(`• "${b.title.slice(0, 48)}" — ${(size / 1048576).toFixed(1)} Mo`);
      // Estimation prudente : /ebook réduit typiquement de ~65 %.
      after += Math.round(size * 0.35);
      done++;
      continue;
    }

    const tmp = abs + ".gs.tmp";
    const ok = await gs([
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=/${QUALITY}`,
      "-dNOPAUSE",
      "-dBATCH",
      "-dQUIET",
      "-dDetectDuplicateImages=true",
      `-sOutputFile=${tmp}`,
      abs,
    ]);

    let tmpSize = 0;
    try {
      tmpSize = (await stat(tmp)).size;
    } catch {
      /* pas de sortie */
    }

    // Ne remplace QUE si la sortie est valide et plus légère.
    if (!ok || tmpSize < 1024 || tmpSize >= size) {
      if (tmpSize) await unlink(tmp).catch(() => {});
      console.log(`=  "${b.title.slice(0, 44)}" — pas de gain, conservé (${(size / 1048576).toFixed(1)} Mo)`);
      after += size;
      skipped++;
      continue;
    }

    await rename(tmp, abs);
    await prisma.book.update({ where: { id: b.id }, data: { pdfSize: tmpSize } });
    after += tmpSize;
    done++;
    console.log(
      `✓ "${b.title.slice(0, 40)}" — ${(size / 1048576).toFixed(1)} → ${(tmpSize / 1048576).toFixed(1)} Mo (-${Math.round((1 - tmpSize / size) * 100)}%)`
    );
  }

  console.log(
    `\n${APPLY ? "Compressés" : "À compresser"} : ${done} · Ignorés : ${skipped}\n` +
      `Avant : ${(before / 1073741824).toFixed(2)} Go → ${APPLY ? "Après" : "Estimé"} : ${(after / 1073741824).toFixed(2)} Go`
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
