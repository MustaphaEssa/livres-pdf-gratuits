import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

const BOOKS_DIR = path.join(process.cwd(), "public", "uploads", "books");
const COVERS_DIR = path.join(process.cwd(), "public", "uploads", "covers");
const AUTHORS_DIR = path.join(process.cwd(), "public", "uploads", "authors");
const MAX_PDF_BYTES = (Number(process.env.MAX_PDF_MB) || 45) * 1024 * 1024;
const UA = "livrespdfgratuits.com (contact@livrespdfgratuits.com)";

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
  if (!/[ÃÂ][\x80-\xBF]/.test(s)) return s;
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

// Descriptions "poubelle" d'Internet Archive (notes de numérisation, pas de vrai contenu)
const JUNK_DESC = /digiti[sz]ed|internet archive|uploaded|scanned|scann[eé]|google|microsoft|from the (library|collection)|brittle books|t[eé]l[eé]vers|num[eé]ris[eé]/i;

// Nettoie une description IA : jointure si tableau, retrait HTML, rejet si vide/poubelle
function cleanDescription(raw: unknown): string | null {
  let s = Array.isArray(raw) ? raw.map(String).join(" ") : typeof raw === "string" ? raw : "";
  s = stripHtml(fixEncoding(s) ?? "");
  if (!s || s.length < 40 || JUNK_DESC.test(s)) return null;
  return s.slice(0, 1500);
}

// Génère une description propre et lisible à partir des métadonnées réelles
function composeDescription(
  title: string,
  authorName: string,
  year: number | null,
  publisher: string | null,
  pageCount: number | null
): string {
  let s = `« ${title} » est un ouvrage de ${authorName}`;
  if (year) s += `, publié en ${year}`;
  if (publisher) s += ` aux éditions ${publisher}`;
  s += ".";
  s += ` Ce livre du domaine public${pageCount ? ` (${pageCount} pages)` : ""} est disponible gratuitement en téléchargement PDF et en lecture en ligne.`;
  return s;
}

export function formatAuthorName(raw: string): string {
  const s = raw
    .replace(/\[.*?\]/g, "")
    .replace(/\d{3,4}\s*-\s*\d{0,4}/g, "")
    .replace(/[;,]\s*$/g, "")
    .trim();
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return (parts[0] || s || raw).trim();
}
function parseDates(raw: string): { birthYear: number | null; deathYear: number | null } {
  const m = raw.match(/(\d{3,4})\s*-\s*(\d{3,4})?/);
  if (!m) return { birthYear: null, deathYear: null };
  return { birthYear: Number(m[1]), deathYear: m[2] ? Number(m[2]) : null };
}

async function fetchJson(url: string, timeoutMs = 30000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA } });
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
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA } });
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

export interface SearchDoc {
  identifier: string;
  title?: string | string[];
}

// Normalise (minuscules, sans accents/ponctuation)
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ");
}

// Convertit "Victor Hugo" -> "Hugo, Victor" (format créateur d'Internet Archive).
// Laisse tel quel si une virgule est déjà présente.
function toArchiveCreator(input: string): string {
  const s = input.trim();
  if (s.includes(",")) return s;
  const parts = s.split(/\s+/);
  if (parts.length < 2) return s;
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return `${last}, ${first}`;
}

// Nom de famille (dernier mot significatif) pour vérifier les résultats
function surname(input: string): string {
  const s = input.includes(",") ? input.split(",")[0] : input.trim().split(/\s+/).pop() ?? input;
  return norm(s).trim();
}

// Recherche les livres d'un auteur (domaine public, PDF) sur Internet Archive.
// Recherche par mots-clés (tolère les accents et l'ordre nom/prénom) ; la
// vérification du nom de famille dans importBook filtre les faux positifs.
export async function searchAuthor(author: string, rows: number): Promise<SearchDoc[]> {
  const tokens = norm(author).split(/\s+/).filter((t) => t.length > 1);
  const creatorQ = tokens.length ? `creator:(${tokens.join(" AND ")})` : `creator:(${author})`;
  const q = `${creatorQ} AND mediatype:texts AND format:(PDF) AND language:(French OR Français OR fre OR fra) AND year:[1500 TO 1929]`;
  const url =
    "https://archive.org/advancedsearch.php?q=" +
    encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&sort[]=downloads+desc&rows=" +
    rows +
    "&page=1&output=json";
  const data = (await fetchJson(url)) as { response?: { docs?: SearchDoc[] } };
  return data?.response?.docs ?? [];
}

export interface ImportResult {
  status: "ok" | "skip" | "duplicate" | "fail";
  title?: string;
  authorSlug?: string;
  authorRaw?: string;
}

// Règles de détection de catégorie à partir des sujets Internet Archive
// (texte normalisé sans accents)
const SUBJECT_RULES: { slug: string; re: RegExp }[] = [
  { slug: "poesie", re: /poesie|poeme|poetry|poetique/ },
  { slug: "romans", re: /fiction|roman|nouvelle|novel|conte|recit|theatre|drame|comedie/ },
  { slug: "histoire", re: /histoire|history|historique|guerre|revolution|antiquite|moyen age/ },
  { slug: "sciences", re: /science|physique|chimie|astronomie|biolog|mathemat|geolog|medecine|botani|zoolog|naturelle/ },
  { slug: "philosophie", re: /philosoph|morale|ethique|metaphysique|logique/ },
  { slug: "religion", re: /religion|theolog|bible|islam|coran|chretien|christian|catholic|protestant|sermon|spiritualite|eglise/ },
  { slug: "informatique", re: /informatique|mecanique|technique|ingenierie|technolog/ },
  { slug: "biographies", re: /biographie|memoire|correspondance|lettres|autobiograph/ },
];

// Déduit les slugs de catégories depuis les métadonnées (sujets + titre)
function detectCategorySlugs(md: Record<string, unknown>): string[] {
  const subject = Array.isArray(md.subject) ? md.subject.map(String).join(" ") : one(md.subject) ?? "";
  const hay = norm(`${subject} ${one(md.title) ?? ""}`);
  const slugs = new Set<string>();
  for (const r of SUBJECT_RULES) if (r.re.test(hay)) slugs.add(r.slug);
  return Array.from(slugs);
}

// Importe un livre depuis Internet Archive (PDF + couverture + métadonnées)
export async function importBook(
  identifier: string,
  fallbackAuthor: string,
  categoryMap: Record<string, string> // slug -> id des catégories existantes
): Promise<ImportResult> {
  // Anti-doublon : si ce livre d'Internet Archive est déjà importé, on saute
  // (avant tout téléchargement) et on renvoie son titre pour le journal
  const dup = await prisma.book.findFirst({
    where: { sourceId: identifier },
    select: { title: true },
  });
  if (dup) {
    return { status: "duplicate", title: dup.title };
  }

  let meta: { metadata?: Record<string, unknown>; files?: { name: string; size?: string }[] };
  try {
    meta = (await fetchJson(`https://archive.org/metadata/${identifier}`)) as typeof meta;
  } catch {
    return { status: "fail" };
  }
  const md = meta?.metadata ?? {};
  const files = meta?.files ?? [];
  if (md["access-restricted-item"] === "true") return { status: "skip" };

  // Vérifie que le créateur correspond bien à l'auteur recherché
  const creatorStr = Array.isArray(md.creator)
    ? md.creator.map(String).join(" ")
    : one(md.creator) ?? "";
  const sn = surname(fallbackAuthor);
  if (sn && !norm(creatorStr).includes(sn)) return { status: "skip" };

  const pdfs = files
    .filter((f) => /\.pdf$/i.test(f.name) && f.size)
    .map((f) => ({ name: f.name, size: Number(f.size) }))
    .filter((f) => f.size > 0 && f.size <= MAX_PDF_BYTES)
    .sort((a, b) => b.size - a.size);
  if (!pdfs.length) return { status: "skip" };
  const pdf = pdfs[0];

  const title = fixEncoding(one(md.title)) || identifier;
  let slug = slugify(title) || slugify(identifier);
  if (await prisma.book.count({ where: { slug } })) {
    slug = `${slug}-${identifier.slice(-6).toLowerCase()}`;
    if (await prisma.book.count({ where: { slug } })) return { status: "skip" };
  }

  let pdfBuf: Buffer;
  try {
    pdfBuf = await fetchBuffer(`https://archive.org/download/${identifier}/${encodeURIComponent(pdf.name)}`);
  } catch {
    return { status: "fail" };
  }
  if (!pdfBuf.subarray(0, 5).toString("latin1").startsWith("%PDF")) return { status: "fail" };

  await mkdir(BOOKS_DIR, { recursive: true });
  await writeFile(path.join(BOOKS_DIR, `${slug}.pdf`), pdfBuf);

  let coverImage: string | null = null;
  try {
    const coverBuf = await fetchBuffer(`https://archive.org/services/img/${identifier}`, 30000);
    if (coverBuf.length > 500) {
      await mkdir(COVERS_DIR, { recursive: true });
      await writeFile(path.join(COVERS_DIR, `${slug}.jpg`), coverBuf);
      coverImage = `/uploads/covers/${slug}.jpg`;
    }
  } catch {
    /* couverture optionnelle */
  }

  let pageCount: number | null = Number(one(md.imagecount)) > 0 ? Number(one(md.imagecount)) : null;
  if (!pageCount) pageCount = await pdfPageCount(new Uint8Array(pdfBuf));

  const cleanTitle = title.slice(0, 250);
  // On rattache tous les livres à l'auteur RECHERCHÉ (nom propre et slug
  // cohérents), sinon Internet Archive renvoie des variantes du créateur
  // ("Hugo, Victor, 1802-1885", "Victor Hugo"…) → slugs incohérents + fiche
  // auteur qui ne correspond à aucun livre.
  const authorName = formatAuthorName(fallbackAuthor).slice(0, 200);
  const authorSlug = slugify(authorName);
  const year = parseYear(md);
  const publisher = fixEncoding(one(md.publisher))?.slice(0, 200) ?? null;

  // Description : la vraie si elle est exploitable, sinon on en génère une propre
  const description =
    cleanDescription(md.description) ??
    composeDescription(cleanTitle, authorName, year, publisher, pageCount);

  // Catégories détectées automatiquement (celles qui existent en base)
  const catIds = detectCategorySlugs(md)
    .map((s) => categoryMap[s])
    .filter((id): id is string => Boolean(id));

  await prisma.book.create({
    data: {
      slug,
      sourceId: identifier,
      title: cleanTitle,
      author: authorName,
      authorSlug,
      description,
      pdfUrl: `/uploads/books/${slug}.pdf`,
      pdfSize: pdf.size,
      pageCount,
      coverImage,
      language: "fr",
      publishedYear: year,
      publisher,
      isbn: one(md.isbn) ?? null,
      isPublished: true,
      isFeatured: false,
      categories: catIds.length
        ? { create: catIds.map((categoryId) => ({ categoryId })) }
        : undefined,
    },
  });

  return { status: "ok", title: cleanTitle, authorSlug, authorRaw: authorName };
}

// Recherche un auteur sur Wikipédia (API de recherche, tolérante aux variantes
// de nom) et renvoie la photo + l'intro. `lang` = "fr" ou "en".
async function wikipediaLookup(
  name: string,
  lang: string
): Promise<{ image: string | null; bio: string | null }> {
  try {
    const url =
      `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&redirects=1` +
      `&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=500&exintro=1&explaintext=1` +
      `&generator=search&gsrsearch=${encodeURIComponent(name)}&gsrlimit=1`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return { image: null, bio: null };
    const d = (await res.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string }; extract?: string }> };
    };
    const pages = d?.query?.pages;
    if (!pages) return { image: null, bio: null };
    const page = Object.values(pages)[0];
    return {
      image: page?.thumbnail?.source ?? null,
      bio: page?.extract ? page.extract.slice(0, 1200) : null,
    };
  } catch {
    return { image: null, bio: null };
  }
}

// Crée/complète la fiche auteur (photo + bio Wikipédia FR, repli EN pour la photo)
export async function upsertAuthorProfile(authorSlug: string, rawName: string): Promise<boolean> {
  const name = formatAuthorName(rawName);
  const { birthYear, deathYear } = parseDates(rawName);

  // FR d'abord (bio en français), puis EN en secours pour la photo
  const fr = await wikipediaLookup(name, "fr");
  let imgUrl = fr.image;
  let bio = fr.bio;
  if (!imgUrl) {
    const en = await wikipediaLookup(name, "en");
    imgUrl = en.image;
    if (!bio) bio = en.bio; // bio EN seulement si aucune bio FR
  }

  let image: string | null = null;
  if (imgUrl) {
    try {
      const buf = await fetchBuffer(imgUrl, 30000);
      if (buf.length > 500) {
        const ext = (imgUrl.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] ?? "jpg")
          .toLowerCase()
          .replace("jpeg", "jpg");
        await mkdir(AUTHORS_DIR, { recursive: true });
        await writeFile(path.join(AUTHORS_DIR, `${authorSlug}.${ext}`), buf);
        image = `/uploads/authors/${authorSlug}.${ext}`;
      }
    } catch {
      /* image optionnelle */
    }
  }

  await prisma.author.upsert({
    where: { slug: authorSlug },
    update: { name, bio, birthYear, deathYear, ...(image ? { image } : {}) },
    create: { slug: authorSlug, name, image, bio, birthYear, deathYear },
  });
  return !!image;
}
