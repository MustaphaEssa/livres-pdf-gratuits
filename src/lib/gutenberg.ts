import "server-only";
import { writeFile, mkdir, readFile, stat } from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";
import { formatAuthorName } from "@/lib/import-archive";

/**
 * Import depuis Project Gutenberg (domaine public, fichiers TEXTE légers).
 *
 * Pourquoi Gutenberg plutôt qu'Internet Archive : IA héberge des PDF *scannés*
 * (images, 20–50 Mo). Gutenberg fournit du texte propre (EPUB + .txt, ~0,3–1 Mo).
 * On récupère l'EPUB directement et on GÉNÈRE un PDF léger depuis le texte
 * (pdfkit) → fiche PDF + EPUB légers, auto-hébergés, comme bdebooks.
 *
 * Recherche : via le catalogue officiel `pg_catalog.csv` (mis en cache), car
 * l'API tierce gutendex est peu fiable.
 */

const BOOKS_DIR = path.join(process.cwd(), "public", "uploads", "books");
const COVERS_DIR = path.join(process.cwd(), "public", "uploads", "covers");
const CACHE_DIR = path.join(process.cwd(), "public", "uploads", ".cache");
const CATALOG_PATH = path.join(CACHE_DIR, "pg_catalog.csv");
const CATALOG_URL = "https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv";
const CATALOG_MAX_AGE_MS = 7 * 24 * 3600 * 1000; // 7 jours
const UA = "livrespdfgratuits.com (contact@livrespdfgratuits.com)";

// ---------------------------------------------------------------- utilitaires

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Nom de famille (pour matcher un auteur du catalogue, format "Nom, Prénom, dates")
function surname(input: string): string {
  const s = input.includes(",") ? input.split(",")[0] : input.trim().split(/\s+/).pop() ?? input;
  return norm(s).trim();
}

async function fetchBuffer(url: string, timeoutMs = 120000): Promise<Buffer> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

function imageExt(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP")
    return "webp";
  return null;
}

// ---------------------------------------------------------------- catalogue

export interface GutenbergRow {
  id: number;
  title: string;
  authors: string; // brut, "Nom, Prénom, dates; Autre, ..."
  language: string;
  subjects: string;
  bookshelves: string;
}

let CATALOG: GutenbergRow[] | null = null;

// Parse une ligne CSV (gère les champs entre guillemets et les "" échappés)
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

// Télécharge le catalogue si absent ou périmé
async function ensureCatalogFile(): Promise<void> {
  try {
    const st = await stat(CATALOG_PATH);
    if (Date.now() - st.mtimeMs < CATALOG_MAX_AGE_MS && st.size > 1_000_000) return;
  } catch {
    /* absent → on télécharge */
  }
  const buf = await fetchBuffer(CATALOG_URL, 120000);
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CATALOG_PATH, buf);
}

// Charge (et met en cache mémoire) les livres TEXTE en français du catalogue
export async function loadCatalog(): Promise<GutenbergRow[]> {
  if (CATALOG) return CATALOG;
  await ensureCatalogFile();
  const raw = await readFile(CATALOG_PATH, "utf8");
  const lines = raw.split(/\r?\n/);
  // En-tête : Text#,Type,Issued,Title,Language,Authors,Subjects,LoCC,Bookshelves
  const rows: GutenbergRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = parseCsvLine(lines[i]);
    if (f.length < 9) continue;
    const type = f[1];
    const language = f[4];
    if (type !== "Text") continue;
    if (!/\bfr\b/i.test(language)) continue; // français (fr, parfois "fr, en")
    const id = parseInt(f[0], 10);
    if (!Number.isFinite(id)) continue;
    rows.push({
      id,
      title: f[3],
      language,
      authors: f[5],
      subjects: f[6],
      bookshelves: f[8],
    });
  }
  CATALOG = rows;
  return rows;
}

export function catalogSize(): number | null {
  return CATALOG ? CATALOG.length : null;
}

// Recherche les ouvrages d'un auteur (français, texte) dans le catalogue Gutenberg.
export async function searchGutenbergAuthor(author: string, max = 50): Promise<GutenbergRow[]> {
  const cat = await loadCatalog();
  const sn = surname(author);
  const full = norm(author);
  if (!sn) return [];
  const hits = cat.filter((r) => {
    const a = norm(r.authors);
    // match sur le nom de famille + au moins un autre token du nom demandé
    if (!a.includes(sn)) return false;
    const otherTokens = full.split(" ").filter((t) => t.length > 2 && t !== sn);
    return otherTokens.length === 0 || otherTokens.some((t) => a.includes(t));
  });
  // Dédoublonne par titre normalisé, limite
  const seen = new Set<string>();
  const out: GutenbergRow[] = [];
  for (const r of hits) {
    const key = norm(r.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}

// Liste les auteurs distincts du catalogue dont le nom matche une requête (pour l'admin)
export async function suggestGutenbergAuthors(query: string, max = 20): Promise<{ name: string; count: number }[]> {
  const cat = await loadCatalog();
  const q = norm(query);
  const counts = new Map<string, number>();
  for (const r of cat) {
    // 1er auteur du champ (format "Nom, Prénom, dates; …")
    const first = r.authors.split(";")[0]?.trim();
    if (!first) continue;
    if (q && !norm(first).includes(q)) continue;
    const name = formatAuthorName(first);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max);
}

// ---------------------------------------------------------------- catégories

const SUBJECT_RULES: { slug: string; re: RegExp }[] = [
  { slug: "poesie", re: /poesie|poeme|poetry|poetique|vers/ },
  { slug: "romans", re: /fiction|roman|nouvelle|novel|conte|recit|theatre|drama|drame|comedie|aventure|love stories/ },
  { slug: "histoire", re: /histoire|history|historique|guerre|war|revolution|antiquite|moyen age|biography and autobiography/ },
  { slug: "sciences", re: /science|physique|chimie|astronomie|biolog|mathemat|geolog|medecine|botani|zoolog|naturelle|nature/ },
  { slug: "philosophie", re: /philosoph|morale|ethique|metaphysique|logique/ },
  { slug: "religion", re: /religion|theolog|bible|islam|coran|chretien|christian|catholic|sermon|spiritualite|eglise/ },
  { slug: "informatique", re: /informatique|mecanique|technique|ingenierie|technolog/ },
  { slug: "biographies", re: /biographie|memoire|correspondance|lettres|autobiograph|biography/ },
];

function detectCategorySlugs(row: GutenbergRow): string[] {
  const hay = norm(`${row.subjects} ${row.bookshelves} ${row.title}`);
  const slugs = new Set<string>();
  for (const r of SUBJECT_RULES) if (r.re.test(hay)) slugs.add(r.slug);
  return Array.from(slugs);
}

function composeDescription(title: string, authorName: string, year: number | null): string {
  let s = `« ${title} » est un ouvrage de ${authorName}`;
  if (year) s += `, publié en ${year}`;
  s += ".";
  s += " Ce livre du domaine public est disponible gratuitement en téléchargement PDF et EPUB, et en lecture en ligne.";
  return s;
}

// ---------------------------------------------------------------- texte → PDF

// Nettoie un texte Gutenberg : retire l'en-tête/pied de licence et découpe en
// paragraphes (les lignes d'un même paragraphe sont rejointes).
function cleanGutenbergText(raw: string): { paragraphs: string[]; title?: string } {
  let s = raw.replace(/\r\n/g, "\n");
  const start = s.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i);
  if (start && start.index != null) s = s.slice(start.index + start[0].length);
  const end = s.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (end && end.index != null) s = s.slice(0, end.index);
  // Retire une éventuelle ligne "Produced by …"
  s = s.replace(/^\s*Produced by[^\n]*\n/i, "");

  const blocks = s.split(/\n\s*\n/);
  const paragraphs: string[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const joined = lines.join(" ").replace(/\s+/g, " ").trim();
    if (joined) paragraphs.push(joined);
  }
  return { paragraphs };
}

// Génère un PDF léger et paginé à partir des paragraphes (pdfkit, police serif
// intégrée Times-Roman → aucun fichier externe). Renvoie le buffer + nb de pages.
async function generatePdf(
  title: string,
  authorName: string,
  paragraphs: string[]
): Promise<{ buf: Buffer; pages: number }> {
  const { default: PDFDocument } = await import("pdfkit");
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 64, bottom: 64, left: 64, right: 64 },
        info: { Title: title, Author: authorName },
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      let pageCount = 0;
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("error", reject);
      doc.on("end", () => {
        resolve({ buf: Buffer.concat(chunks), pages: pageCount });
      });

      // Page de titre
      doc.moveDown(6);
      doc.font("Times-Bold").fontSize(28).text(title, { align: "center" });
      doc.moveDown(1);
      doc.font("Times-Roman").fontSize(16).text(authorName, { align: "center" });
      doc.moveDown(4);
      doc.fontSize(10).fillColor("#666").text("livrespdfgratuits.com — domaine public", { align: "center" });
      doc.fillColor("#000");

      // Corps
      doc.addPage();
      doc.font("Times-Roman").fontSize(12);
      const isHeading = (p: string) =>
        p.length <= 60 && (/^(chapitre|chapter|livre|partie|tome|[IVXLC]+\.?$)/i.test(p) || p === p.toUpperCase());
      for (const p of paragraphs) {
        if (isHeading(p)) {
          doc.moveDown(0.8).font("Times-Bold").fontSize(14).text(p, { align: "left" });
          doc.moveDown(0.3).font("Times-Roman").fontSize(12);
        } else {
          doc.text(p, { align: "justify", lineGap: 2, paragraphGap: 6, indent: 18 });
        }
      }

      // Numéros de page (saute la page de titre)
      const range = doc.bufferedPageRange();
      pageCount = range.count;
      for (let i = 1; i < range.count; i++) {
        doc.switchToPage(i);
        doc.font("Times-Roman").fontSize(9).fillColor("#888");
        doc.text(String(i), 0, doc.page.height - 40, { align: "center", width: doc.page.width });
        doc.fillColor("#000");
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// ---------------------------------------------------------------- import

export interface ImportResult {
  status: "ok" | "skip" | "duplicate" | "fail";
  title?: string;
  authorSlug?: string;
  authorRaw?: string;
}

function parseYear(row: GutenbergRow): number | null {
  // Les dates d'auteur "1802-1885" ne sont pas l'année de publication ; on
  // laisse null (Gutenberg ne fournit pas de façon fiable l'année de 1re édition).
  return null;
}

// Importe un livre Gutenberg : texte→PDF + EPUB + couverture + métadonnées.
export async function importGutenbergBook(
  row: GutenbergRow,
  fallbackAuthor: string,
  categoryMap: Record<string, string>
): Promise<ImportResult> {
  const sourceId = `gutenberg:${row.id}`;

  // Anti-doublon par identifiant source
  const dup = await prisma.book.findFirst({ where: { sourceId }, select: { title: true } });
  if (dup) return { status: "duplicate", title: dup.title };

  const title = (row.title || `Gutenberg ${row.id}`).replace(/\s+/g, " ").trim().slice(0, 250);
  const authorName = formatAuthorName(fallbackAuthor).slice(0, 200);
  const authorSlug = slugify(authorName);
  const normTitle = norm(title);

  // Anti-doublon par titre + auteur (évite les variantes IA déjà présentes)
  if (authorSlug && normTitle) {
    const sameAuthor = await prisma.book.findMany({ where: { authorSlug }, select: { title: true } });
    if (sameAuthor.some((e) => norm(e.title) === normTitle)) return { status: "duplicate", title };
  }

  // Slug unique
  let slug = slugify(title) || `gutenberg-${row.id}`;
  if (await prisma.book.count({ where: { slug } })) {
    slug = `${slug}-g${row.id}`;
    if (await prisma.book.count({ where: { slug } })) return { status: "skip" };
  }

  // 1) Texte → PDF
  let text: string;
  try {
    const txtBuf = await fetchBuffer(`https://www.gutenberg.org/cache/epub/${row.id}/pg${row.id}.txt`, 90000);
    text = txtBuf.toString("utf8");
  } catch {
    // repli : route /ebooks/<id>.txt.utf-8
    try {
      const txtBuf = await fetchBuffer(`https://www.gutenberg.org/ebooks/${row.id}.txt.utf-8`, 90000);
      text = txtBuf.toString("utf8");
    } catch {
      return { status: "fail" };
    }
  }
  const { paragraphs } = cleanGutenbergText(text);
  if (paragraphs.length < 3) return { status: "skip" }; // texte vide/illisible

  let pdfBuf: Buffer;
  let pages: number;
  try {
    ({ buf: pdfBuf, pages } = await generatePdf(title, authorName, paragraphs));
  } catch {
    return { status: "fail" };
  }
  await mkdir(BOOKS_DIR, { recursive: true });
  await writeFile(path.join(BOOKS_DIR, `${slug}.pdf`), pdfBuf);

  // 2) EPUB (léger, direct Gutenberg) — auto-hébergé
  let epubUrl: string | null = null;
  try {
    const epubBuf = await fetchBuffer(`https://www.gutenberg.org/ebooks/${row.id}.epub.images`, 90000);
    if (epubBuf.length > 1000 && epubBuf.subarray(0, 2).toString("latin1") === "PK") {
      await writeFile(path.join(BOOKS_DIR, `${slug}.epub`), epubBuf);
      epubUrl = `/uploads/books/${slug}.epub`;
    }
  } catch {
    /* EPUB optionnel */
  }

  // 3) Couverture générée par Gutenberg (rejette si minuscule/absente)
  let coverImage: string | null = null;
  try {
    const imgBuf = await fetchBuffer(`https://www.gutenberg.org/cache/epub/${row.id}/pg${row.id}.cover.medium.jpg`, 30000);
    const ext = imageExt(imgBuf);
    if (ext && imgBuf.length > 2000) {
      await mkdir(COVERS_DIR, { recursive: true });
      await writeFile(path.join(COVERS_DIR, `${slug}.${ext}`), imgBuf);
      coverImage = `/uploads/covers/${slug}.${ext}`;
    }
  } catch {
    /* couverture optionnelle → repli initiale du titre */
  }

  const year = parseYear(row);
  const catIds = detectCategorySlugs(row)
    .map((s) => categoryMap[s])
    .filter((id): id is string => Boolean(id));

  await prisma.book.create({
    data: {
      slug,
      sourceId,
      title,
      author: authorName,
      authorSlug,
      description: composeDescription(title, authorName, year),
      pdfUrl: `/uploads/books/${slug}.pdf`,
      pdfSize: pdfBuf.length,
      epubUrl,
      pageCount: pages,
      coverImage,
      language: "fr",
      publishedYear: year,
      isPublished: true,
      isFeatured: false,
      categories: catIds.length ? { create: catIds.map((categoryId) => ({ categoryId })) } : undefined,
    },
  });

  return { status: "ok", title, authorSlug, authorRaw: authorName };
}
