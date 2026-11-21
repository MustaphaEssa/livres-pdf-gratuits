/**
 * Remplace les couvertures GÉNÉRIQUES de Project Gutenberg (bandeau blanc + aplats
 * de couleurs vives + « Project Gutenberg ») par une couverture dessinée aux couleurs
 * du site : fond profond, filets dorés, titre et auteur composés. JPEG léger (~15-25 Ko).
 *
 * Les vraies couvertures (scans d'éditions anciennes) ne sont jamais touchées :
 * seule une image qui ressemble au gabarit Gutenberg est remplacée.
 *
 *   node scripts/generate-covers.mjs                 # aperçu : compte + 8 exemples dans /tmp/covers-sample
 *   node scripts/generate-covers.mjs --apply         # remplace (nouveau fichier <slug>-c.jpg)
 *   LIMIT=100 node scripts/generate-covers.mjs --apply
 *
 * Réversible : l'ancienne image reste sur le disque ; seul Book.coverImage change.
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
// --redo : refait les couvertures dessinées dont le titre avait été tronqué (« L'assommo… »)
const REDO = process.argv.includes("--redo");
const LIMIT = Number(process.env.LIMIT) || Infinity;
const PUB = path.join(process.cwd(), "public");
// Vraies couvertures au titre très pâle, repérées lors du contrôle visuel : jamais remplacées
const KEEP = new Set(["contes-choisis-00unse", "the-counterplot", "lord-palmerston", ...(process.env.KEEP ?? "").split(",").filter(Boolean)]);
const SAMPLE_DIR = "/tmp/covers-sample";
const W = 400;
const H = 600;

// ------------------------------------------------------------------ détection

/** Gabarit Gutenberg : haut presque blanc pur, bas dominé par des aplats saturés. */
async function isGenericCover(file) {
  const { data, info } = await sharp(file).resize(60, 90, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  let white = 0;
  let topN = 0;
  for (let y = 3; y < 24; y++)
    for (let x = 3; x < 57; x++) {
      const [r, g, b] = px(x, y);
      topN++;
      if (r > 235 && g > 235 && b > 235) white++;
    }
  let sat = 0;
  let soft = 0; // couleurs pastel (gabarits Gutenberg moins saturés)
  let botN = 0;
  for (let y = 34; y < 84; y++)
    for (let x = 0; x < 60; x++) {
      const [r, g, b] = px(x, y);
      botN++;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (chroma > 90) sat++;
      if (chroma > 40) soft++;
    }
  // Titre long : le bandeau contient beaucoup de texte → seuil de blanc à 55 %
  // Les pages de titre scannées (papier presque sans couleur) n'atteignent aucun des deux seuils.
  return (white / topN > 0.55 && sat / botN > 0.5) || (white / topN > 0.6 && soft / botN > 0.6);
}

/**
 * Reliure sans titre (scan Internet Archive : toile unie ou papier marbré) :
 * image très sombre dont le centre ne contient AUCUN contour net (pas de lettres).
 * Seuil volontairement prudent, calibré sur planches de contrôle : la première vraie
 * couverture (titre pâle) apparaît à 0,0002 ; les reliures avec étiquette à code-barres
 * ne sont pas touchées (l'étiquette ressemble à du texte).
 */
async function isBlankBinding(file) {
  {
    const W = 80, H = 120;
    const { data } = await sharp(file).resize(W, H, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const L = (x, y) => data[y * W + x] / 255;
    let dark = 0, c = 0, cn = 0;
    for (let i = 0; i < W * H; i++) if (data[i] / 255 < 0.3) dark++;
    for (let y = Math.floor(H * 0.12); y < H * 0.75; y++)
      for (let x = Math.floor(W * 0.18); x < W * 0.82; x++) {
        c += Math.abs(L(x + 1, y) - L(x, y)) + Math.abs(L(x, y + 1) - L(x, y));
        cn++;
      }
    if (!(dark / (W * H) > 0.7 && c / cn < 0.035)) return false;
  }
  const W = 200, H = 300;
  const { data } = await sharp(file).resize(W, H, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const L = (x, y) => data[y * W + x] / 255;
  let strong = 0, n = 0;
  for (let y = Math.floor(H * 0.08); y < H * 0.85; y++)
    for (let x = Math.floor(W * 0.15); x < W * 0.85; x++) {
      n++;
      if (Math.max(Math.abs(L(x + 1, y) - L(x, y)), Math.abs(L(x, y + 1) - L(x, y))) > 0.12) strong++;
    }
  return strong / n < 0.00015;
}

// ------------------------------------------------------------------ dessin

const PALETTES = [
  ["#14213D", "#FCA311"], // bleu nuit / or (charte du site)
  ["#4A1D2E", "#E9B872"], // bordeaux
  ["#1F3B2D", "#D9B26F"], // vert forêt
  ["#123C46", "#F2C14E"], // bleu canard
  ["#3B2A4A", "#E6B85C"], // prune
  ["#2A2A2E", "#E0B34A"], // anthracite
];
const IVORY = "#FBF6EA";

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

// « Hugo, Victor, 1802-1885 » → « Victor Hugo »
function authorName(raw) {
  const parts = String(raw ?? "")
    .replace(/\[.*?\]|\(.*?\)/g, "")
    .replace(/\d{3,4}\s*-\s*\d{0,4}/g, "")
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (parts.length >= 2 ? `${parts[1]} ${parts[0]}` : parts[0] ?? "").slice(0, 60);
}

/** Coupe en lignes de `max` caractères environ, au mot près. */
function wrap(text, max) {
  const lines = [];
  let cur = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const w = word.length > max ? `${word.slice(0, max - 1)}…` : word;
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= max) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Plus grande taille de police où le titre tient en 5 lignes, sans couper de mot. */
function layoutTitle(title) {
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  for (const size of [46, 40, 35, 31, 27, 24, 21]) {
    const max = Math.floor(296 / (size * 0.64)); // largeur moyenne d'un caractère DejaVu Serif Bold
    if (longest > max && size > 21) continue;
    const lines = wrap(title, max);
    if (lines.length <= 5) return { size, lines };
  }
  const size = 24;
  const lines = wrap(title, Math.floor(296 / (size * 0.64)));
  return { size, lines: [...lines.slice(0, 4), `${lines[4]}…`] };
}

function coverSvg({ title, author, slug }) {
  const [bg, gold] = PALETTES[hash(slug) % PALETTES.length];
  const main = title.split(/\s*[:;]\s+|\s+[-–—]\s+/)[0].trim() || title;
  const { size, lines } = layoutTitle(main);
  const lh = Math.round(size * 1.18);
  const blockH = lines.length * lh;
  const startY = Math.round(285 - blockH / 2 + size * 0.8);
  const titleSvg = lines
    .map((l, i) => `<text x="200" y="${startY + i * lh}" text-anchor="middle" font-family="DejaVu Serif" font-weight="bold" font-size="${size}" fill="${IVORY}">${esc(l)}</text>`)
    .join("");
  const authorLines = wrap(author.toUpperCase(), 26).slice(0, 2);
  const authorSvg = authorLines
    .map((l, i) => `<text x="200" y="${468 + i * 22}" text-anchor="middle" font-family="DejaVu Sans" font-size="15" letter-spacing="2" fill="${gold}">${esc(l)}</text>`)
    .join("");
  // Losanges décoratifs (motif géométrique discret)
  const diamonds = (y) =>
    [-36, -18, 0, 18, 36]
      .map((dx) => `<rect x="${200 + dx - 4}" y="${y - 4}" width="8" height="8" transform="rotate(45 ${200 + dx} ${y})" fill="${dx === 0 ? gold : "none"}" stroke="${gold}" stroke-width="1.4"/>`)
      .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="${gold}" stroke-width="2"/>
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${gold}" stroke-opacity=".45" stroke-width="1"/>
  ${diamonds(84)}
  ${titleSvg}
  <line x1="150" y1="430" x2="250" y2="430" stroke="${gold}" stroke-width="1.5"/>
  ${authorSvg}
  ${diamonds(540)}
</svg>`;
}

async function renderCover(book, dest) {
  const svg = coverSvg({ title: book.title, author: authorName(book.author), slug: book.slug });
  await sharp(Buffer.from(svg)).jpeg({ quality: 74, mozjpeg: true }).toFile(dest);
  return (await stat(dest)).size;
}

/** Ancienne mise en page (1re version) : un mot plus long que la ligne était tronqué. */
function wasTruncated(title) {
  const main = title.split(/\s*[:;]\s+|\s+[-–—]\s+/)[0].trim() || title;
  for (const size of [46, 40, 35, 31, 27, 24]) {
    const max = Math.floor(296 / (size * 0.64));
    const lines = wrap(main, max);
    if (lines.length <= 5) return lines.some((l) => l.includes("…"));
  }
  return true;
}

// ------------------------------------------------------------------ programme

const books = await prisma.book.findMany({
  // Tous les livres : certains fichiers Gutenberg ont remplacé un scan Internet Archive
  // sans changer sourceId (« alléger les livres lourds »). La détection visuelle suffit.
  where: { isPublished: true, coverImage: { startsWith: "/uploads/covers/" } },
  select: { id: true, slug: true, title: true, author: true, coverImage: true },
});

let generic = 0;
let done = 0;
let bytes = 0;
const samples = [];
await mkdir(APPLY ? path.join(PUB, "uploads", "covers") : SAMPLE_DIR, { recursive: true });

for (const b of books) {
  if (done >= LIMIT) break;
  if (KEEP.has(b.slug)) continue;
  const isDesigned = /-c\d*\.jpg$/.test(b.coverImage);
  if (REDO) {
    // Seulement les couvertures de la 1re version dont un mot du titre était tronqué
    if (!b.coverImage.endsWith("-c.jpg") || !wasTruncated(b.title)) continue;
  } else {
    if (isDesigned) continue; // déjà refaite
    const file = path.join(PUB, b.coverImage);
    let isGen = false;
    try {
      isGen = (await isGenericCover(file)) || (await isBlankBinding(file));
    } catch {
      continue; // fichier absent ou illisible
    }
    if (!isGen) continue;
  }
  generic++;
  if (!APPLY) {
    if (samples.length < 8) {
      samples.push(b.slug);
      bytes += await renderCover(b, path.join(SAMPLE_DIR, `${b.slug}.jpg`));
    }
    continue;
  }
  // Nouveau nom pour une couverture refaite : les navigateurs gardent l'ancienne en cache une semaine
  const name = REDO ? `${b.slug}-c2.jpg` : `${b.slug}-c.jpg`;
  bytes += await renderCover(b, path.join(PUB, "uploads", "covers", name));
  await prisma.book.update({ where: { id: b.id }, data: { coverImage: `/uploads/covers/${name}` } });
  done++;
  if (done % 500 === 0) console.log(`  ${done} couvertures refaites…`);
}

console.log(`${books.length} livres avec couverture locale ; ${generic} couverture(s) générique(s) détectée(s).`);
if (APPLY) console.log(`✓ ${done} couverture(s) remplacée(s), taille moyenne ${Math.round(bytes / Math.max(done, 1) / 1024)} Ko.`);
else console.log(`Aperçu : ${samples.length} exemple(s) dans ${SAMPLE_DIR} (moy. ${Math.round(bytes / Math.max(samples.length, 1) / 1024)} Ko) : ${samples.join(", ")}`);
await prisma.$disconnect();
