/**
 * Cherche la photo + la bio de chaque auteur sur Wikipédia (FR), télécharge
 * l'image dans public/uploads/authors/, et remplit la table Author.
 *
 * Lancer : ./node_modules/.bin/tsx scripts/fetch-author-images.ts
 *
 * Relançable : ne réécrase pas une image existante si Wikipédia ne répond pas.
 */
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const DIR = path.join(process.cwd(), "public", "uploads", "authors");
const UA = "livrespdfgratuits.com (contact@livrespdfgratuits.com)";

function formatAuthorName(raw: string): string {
  // Retire dates et annotations de catalogue, puis reformate "Nom, Prénom"
  let s = raw
    .replace(/\[.*?\]/g, "")
    .replace(/\d{3,4}\s*-\s*\d{0,4}/g, "")
    .replace(/[;,]\s*$/g, "")
    .trim();
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return (parts[0] || s || raw).trim();
}

// Extrait les années de naissance/décès du nom brut (ex: "...1802-1885")
function parseDates(raw: string): { birthYear: number | null; deathYear: number | null } {
  const m = raw.match(/(\d{3,4})\s*-\s*(\d{3,4})?/);
  if (!m) return { birthYear: null, deathYear: null };
  return { birthYear: Number(m[1]), deathYear: m[2] ? Number(m[2]) : null };
}

async function wiki(name: string): Promise<{ image: string | null; bio: string | null }> {
  try {
    const res = await fetch(
      `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { headers: { "User-Agent": UA } }
    );
    if (!res.ok) return { image: null, bio: null };
    const d = (await res.json()) as {
      type?: string;
      extract?: string;
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    if (d.type === "disambiguation") return { image: null, bio: null };
    return {
      image: d.thumbnail?.source ?? d.originalimage?.source ?? null,
      bio: d.extract ?? null,
    };
  } catch {
    return { image: null, bio: null };
  }
}

async function download(url: string, slug: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return null;
    const ext = (url.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] ?? "jpg")
      .toLowerCase()
      .replace("jpeg", "jpg");
    await mkdir(DIR, { recursive: true });
    const file = `${slug}.${ext}`;
    await writeFile(path.join(DIR, file), buf);
    return `/uploads/authors/${file}`;
  } catch {
    return null;
  }
}

async function main() {
  const rows = await prisma.book.groupBy({
    by: ["authorSlug", "author"],
    where: { authorSlug: { not: null } },
  });
  const bySlug = new Map<string, string>();
  for (const r of rows) {
    if (r.authorSlug && !bySlug.has(r.authorSlug)) bySlug.set(r.authorSlug, r.author);
  }

  console.log(`${bySlug.size} auteurs à traiter\n`);
  let withImg = 0;
  for (const [slug, raw] of bySlug) {
    const name = formatAuthorName(raw);
    const { birthYear, deathYear } = parseDates(raw);
    const info = await wiki(name);
    let image: string | null = null;
    if (info.image) {
      image = await download(info.image, slug);
      if (image) withImg++;
    }
    await prisma.author.upsert({
      where: { slug },
      update: { name, bio: info.bio, birthYear, deathYear, ...(image ? { image } : {}) },
      create: { slug, name, image, bio: info.bio, birthYear, deathYear },
    });
    console.log(`${image ? "📷" : "  "} ${name}${birthYear ? ` (${birthYear}-${deathYear ?? ""})` : ""}`);
    await new Promise((r) => setTimeout(r, 300)); // politesse envers Wikipédia
  }
  console.log(`\n✅ Terminé. ${bySlug.size} auteurs, ${withImg} avec photo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
