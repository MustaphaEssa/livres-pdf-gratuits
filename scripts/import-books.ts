/**
 * Import de livres PDF gratuits (domaine public) depuis Internet Archive.
 *
 * Pour chaque catégorie, interroge l'API advancedsearch d'archive.org, puis
 * pour chaque livre : télécharge le PDF + la couverture dans public/uploads/,
 * détecte le nombre de pages, et crée le livre en base.
 *
 * Légal : filtre sur année <= 1929 (domaine public) + mediatype texts + FR.
 *
 * Lancer : npx tsx scripts/import-books.ts
 *   Variables : PER_CATEGORY (def. 25), MAX_PDF_MB (def. 45)
 */
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const PER_CATEGORY = Number(process.env.PER_CATEGORY) || 25;
const MAX_PDF_BYTES = (Number(process.env.MAX_PDF_MB) || 45) * 1024 * 1024;
const BOOKS_DIR = path.join(process.cwd(), "public", "uploads", "books");
const COVERS_DIR = path.join(process.cwd(), "public", "uploads", "covers");

// Requêtes par catégorie (sujets Internet Archive)
const categoryQueries: Record<string, string> = {
  romans: "(subject:roman OR subject:fiction OR subject:nouvelles)",
  sciences: "(subject:science OR subject:sciences OR subject:physique OR subject:chimie OR subject:astronomie)",
  histoire: "(subject:histoire OR subject:history)",
  informatique: "(subject:mathématiques OR subject:mécanique OR subject:technique OR subject:géométrie)",
  religion: "(subject:religion OR subject:théologie OR subject:islam OR subject:christianisme OR subject:bible)",
  philosophie: "(subject:philosophie OR subject:philosophy OR subject:morale)",
  poesie: "(subject:poésie OR subject:poèmes OR subject:poetry)",
  biographies: "(subject:biographie OR subject:mémoires OR subject:correspondance)",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// Normalise un champ de métadonnées (string | string[] | undefined)
function one(v: unknown): string | undefined {
  if (Array.isArray(v)) return v.length ? String(v[0]) : undefined;
  if (v === undefined || v === null) return undefined;
  return String(v);
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Corrige le mojibake UTF-8 double-encodé (ex: "MÃ©moires" -> "Mémoires")
function fixEncoding(s: string | undefined): string | undefined {
  if (!s) return s;
  if (!/[ÃÂ][\x80-\xBF-¿]/.test(s)) return s;
  try {
    const fixed = Buffer.from(s, "latin1").toString("utf8");
    // On ne garde la correction que si elle ne produit pas de caractère de remplacement
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
    const doc = await pdfjs.getDocument({
      data,
      isEvalSupported: false,
      useWorkerFetch: false,
    }).promise;
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

async function searchCategory(query: string, rows: number): Promise<SearchDoc[]> {
  const q = `${query} AND mediatype:texts AND format:(PDF) AND language:(French OR Français) AND year:[1500 TO 1929]`;
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title" +
    "&sort[]=downloads+desc&rows=" +
    rows +
    "&page=1&output=json";
  const data = await fetchJson(url);
  return data?.response?.docs ?? [];
}

async function categoryId(slug: string): Promise<string | null> {
  const c = await prisma.category.findUnique({ where: { slug } });
  return c?.id ?? null;
}

async function importOne(
  identifier: string,
  catSlug: string,
  catId: string | null
): Promise<"ok" | "skip" | "fail"> {
  // Métadonnées
  let meta: any;
  try {
    meta = await fetchJson(`https://archive.org/metadata/${identifier}`);
  } catch {
    return "fail";
  }
  const md = meta?.metadata ?? {};
  const files: any[] = meta?.files ?? [];

  // Ne garder que le domaine public accessible
  if (md["access-restricted-item"] === "true") return "skip";

  // Trouver le meilleur fichier PDF sous la limite de taille
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

  // Dédoublonnage de slug
  if (await prisma.book.count({ where: { slug } })) {
    slug = `${slug}-${identifier.slice(-6).toLowerCase()}`;
    if (await prisma.book.count({ where: { slug } })) return "skip";
  }

  // Téléchargement du PDF
  let pdfBuf: Buffer;
  try {
    pdfBuf = await fetchBuffer(
      `https://archive.org/download/${identifier}/${encodeURIComponent(pdf.name)}`
    );
  } catch {
    return "fail";
  }
  if (!pdfBuf.subarray(0, 5).toString("latin1").startsWith("%PDF")) return "fail";

  await mkdir(BOOKS_DIR, { recursive: true });
  const pdfFileName = `${slug}.pdf`;
  await writeFile(path.join(BOOKS_DIR, pdfFileName), pdfBuf);

  // Couverture (miniature générée par archive.org)
  let coverImage: string | null = null;
  try {
    const coverBuf = await fetchBuffer(
      `https://archive.org/services/img/${identifier}`,
      30000
    );
    if (coverBuf.length > 500) {
      await mkdir(COVERS_DIR, { recursive: true });
      const coverName = `${slug}.jpg`;
      await writeFile(path.join(COVERS_DIR, coverName), coverBuf);
      coverImage = `/uploads/covers/${coverName}`;
    }
  } catch {
    /* couverture optionnelle */
  }

  // Nombre de pages : imagecount sinon pdfjs
  let pageCount: number | null =
    Number(one(md.imagecount)) > 0 ? Number(one(md.imagecount)) : null;
  if (!pageCount) pageCount = await pdfPageCount(new Uint8Array(pdfBuf));

  const descRaw = fixEncoding(one(md.description));
  const description = descRaw ? stripHtml(descRaw).slice(0, 1200) : null;

  await prisma.book.create({
    data: {
      slug,
      title: title.slice(0, 250),
      author: (fixEncoding(one(md.creator)) || "Auteur inconnu").slice(0, 200),
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
  console.log(
    `Import: ${PER_CATEGORY}/catégorie, PDF max ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} Mo\n`
  );
  let grandTotal = 0;

  for (const [slug, query] of Object.entries(categoryQueries)) {
    const catId = await categoryId(slug);
    console.log(`\n=== Catégorie: ${slug} ===`);
    let imported = 0;

    // On récupère large pour pouvoir sauter les échecs/non-PD
    const docs = await searchCategory(query, PER_CATEGORY * 5).catch(() => []);
    console.log(`  ${docs.length} résultats trouvés`);

    for (const doc of docs) {
      if (imported >= PER_CATEGORY) break;
      const res = await importOne(doc.identifier, slug, catId).catch(
        () => "fail" as const
      );
      if (res === "ok") {
        imported++;
        grandTotal++;
        process.stdout.write(`  [${imported}/${PER_CATEGORY}] ✓ ${doc.identifier}\n`);
      }
    }
    console.log(`  -> ${imported} importés pour ${slug}`);
  }

  console.log(`\n✅ Terminé. ${grandTotal} livres importés au total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
