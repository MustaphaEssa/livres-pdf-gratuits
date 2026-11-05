/**
 * Import de TOUS les livres (domaine public) d'un auteur depuis Internet Archive.
 *
 * Exemples :
 *   AUTHOR="Victor Hugo" ./node_modules/.bin/tsx scripts/import-author.ts
 *   AUTHOR="Victor Hugo" CATEGORY=romans MAX=50 ./node_modules/.bin/tsx scripts/import-author.ts
 *
 * Variables :
 *   AUTHOR   (requis) nom de l'auteur (ex: "Victor Hugo")
 *   CATEGORY (option) slug d'une catégorie existante à associer (ex: romans)
 *   MAX      (option) nombre max de livres à importer (def. 100)
 *   MAX_PDF_MB (option) taille max d'un PDF (def. 45)
 *
 * Légal : filtre année <= 1929 (domaine public) + mediatype texts + PDF.
 */
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const AUTHOR = (process.env.AUTHOR || process.argv[2] || "").trim();
const CATEGORY = (process.env.CATEGORY || process.argv[3] || "").trim();
const MAX = Number(process.env.MAX) || 100;
const MAX_PDF_BYTES = (Number(process.env.MAX_PDF_MB) || 45) * 1024 * 1024;
const BOOKS_DIR = path.join(process.cwd(), "public", "uploads", "books");
const COVERS_DIR = path.join(process.cwd(), "public", "uploads", "covers");

if (!AUTHOR) {
  console.error('Usage : AUTHOR="Victor Hugo" ./node_modules/.bin/tsx scripts/import-author.ts');
  process.exit(1);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function one(v: unknown): string | undefined {
  if (Array.isArray(v)) return v.length ? String(v[0]) : undefined;
  if (v === undefined || v === null) return undefined;
  return String(v);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function fixEncoding(s: string | undefined): string | undefined {
  if (!s) return s;
  if (!/[ÃÂ][-¿]/.test(s)) return s;
  try {
    const fixed = Buffer.from(s, "latin1").toString("utf8");
    return fixed.includes("�") ? s : fixed;
  } catch {
    return s;
  }
}

function parseYear(md: Record<string, unknown>): number | null {
  const raw = one(md.year) || one(md.date) || "";
  const m = raw.match(/(1[0-9]{3}|20[0-2][0-9])/);
  return m ? parseInt(m[1], 10) : null;
}

async function fetchJson(url: string, timeoutMs = 30000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchBuffer(url: string, timeoutMs = 120000): Promise<Buffer> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

async function pdfPageCount(data: Uint8Array): Promise<number | null> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useWorkerFetch: false }).promise;
    const n = doc.numPages;
    await doc.destroy();
    return n;
  } catch {
    return null;
  }
}

interface SearchDoc {
  identifier: string;
  title?: string | string[];
}

async function searchAuthor(author: string, rows: number): Promise<SearchDoc[]> {
  const q = `creator:("${author}") AND mediatype:texts AND format:(PDF) AND year:[1500 TO 1929]`;
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&sort[]=downloads+desc&rows=" +
    rows +
    "&page=1&output=json";
  const data = await fetchJson(url);
  return data?.response?.docs ?? [];
}

async function importOne(identifier: string, catId: string | null): Promise<"ok" | "skip" | "fail"> {
  // Anti-doublon : livre Internet Archive déjà importé
  if (await prisma.book.count({ where: { sourceId: identifier } })) return "skip";

  let meta: any;
  try {
    meta = await fetchJson(`https://archive.org/metadata/${identifier}`);
  } catch {
    return "fail";
  }
  const md = meta?.metadata ?? {};
  const files: any[] = meta?.files ?? [];

  if (md["access-restricted-item"] === "true") return "skip";

  const pdfs = files
    .filter((f) => /\.pdf$/i.test(f.name) && f.size)
    .map((f) => ({ name: f.name as string, size: Number(f.size) }))
    .filter((f) => f.size > 0 && f.size <= MAX_PDF_BYTES)
    .sort((a, b) => b.size - a.size);
  if (!pdfs.length) return "skip";
  const pdf = pdfs[0];

  const title = fixEncoding(one(md.title)) || identifier;
  let slug = slugify(title);
  if (!slug) slug = slugify(identifier);

  if (await prisma.book.count({ where: { slug } })) {
    slug = `${slug}-${identifier.slice(-6).toLowerCase()}`;
    if (await prisma.book.count({ where: { slug } })) return "skip";
  }

  let pdfBuf: Buffer;
  try {
    pdfBuf = await fetchBuffer(`https://archive.org/download/${identifier}/${encodeURIComponent(pdf.name)}`);
  } catch {
    return "fail";
  }
  if (!pdfBuf.subarray(0, 5).toString("latin1").startsWith("%PDF")) return "fail";

  await mkdir(BOOKS_DIR, { recursive: true });
  const pdfFileName = `${slug}.pdf`;
  await writeFile(path.join(BOOKS_DIR, pdfFileName), pdfBuf);

  let coverImage: string | null = null;
  try {
    const coverBuf = await fetchBuffer(`https://archive.org/services/img/${identifier}`, 30000);
    if (coverBuf.length > 500) {
      await mkdir(COVERS_DIR, { recursive: true });
      const coverName = `${slug}.jpg`;
      await writeFile(path.join(COVERS_DIR, coverName), coverBuf);
      coverImage = `/uploads/covers/${coverName}`;
    }
  } catch {
    /* couverture optionnelle */
  }

  let pageCount: number | null = Number(one(md.imagecount)) > 0 ? Number(one(md.imagecount)) : null;
  if (!pageCount) pageCount = await pdfPageCount(new Uint8Array(pdfBuf));

  const descRaw = fixEncoding(one(md.description));
  const description = descRaw ? stripHtml(descRaw).slice(0, 1200) : null;

  const authorName = (fixEncoding(one(md.creator)) || AUTHOR).slice(0, 200);

  await prisma.book.create({
    data: {
      slug,
      sourceId: identifier,
      title: title.slice(0, 250),
      author: authorName,
      authorSlug: slugify(authorName),
      description,
      pdfUrl: `/uploads/books/${pdfFileName}`,
      pdfSize: pdf.size,
      pageCount,
      coverImage,
      language: "fr",
      publishedYear: parseYear(md),
      publisher: fixEncoding(one(md.publisher))?.slice(0, 200) ?? null,
      isbn: one(md.isbn) ?? null,
      isPublished: true,
      isFeatured: false,
      categories: catId ? { create: [{ categoryId: catId }] } : undefined,
    },
  });

  return "ok";
}

async function main() {
  let catId: string | null = null;
  if (CATEGORY) {
    const c = await prisma.category.findUnique({ where: { slug: CATEGORY } });
    if (!c) {
      console.error(`Catégorie "${CATEGORY}" introuvable. Catégories dispo :`);
      const all = await prisma.category.findMany({ select: { slug: true } });
      console.error(all.map((x) => x.slug).join(", "));
      process.exit(1);
    }
    catId = c.id;
  }

  console.log(`Auteur : ${AUTHOR}${CATEGORY ? ` | catégorie : ${CATEGORY}` : ""} | max ${MAX}\n`);

  // On récupère large pour pouvoir sauter les échecs / non-PD
  const docs = await searchAuthor(AUTHOR, MAX * 4).catch(() => []);
  console.log(`${docs.length} résultats trouvés sur Internet Archive\n`);

  let imported = 0;
  for (const doc of docs) {
    if (imported >= MAX) break;
    const res = await importOne(doc.identifier, catId).catch(() => "fail" as const);
    if (res === "ok") {
      imported++;
      process.stdout.write(`  [${imported}] ✓ ${doc.identifier}\n`);
    }
  }

  console.log(`\n✅ Terminé. ${imported} livre(s) importé(s) pour "${AUTHOR}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
