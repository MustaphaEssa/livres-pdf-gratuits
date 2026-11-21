/**
 * Popularité externe de chaque livre, pour classer l'accueil et les étagères par
 * importance réelle plutôt que par hasard :
 *
 *   - Gutenberg       : téléchargements des 30 derniers jours (RDF du livre, miroir pglaf)
 *   - Internet Archive: téléchargements cumulés (advancedsearch, par lots de 50)
 *   - Wikipédia       : vues de l'article de l'œuvre sur 12 mois (API pageviews),
 *                       pour les livres dont un résumé Wikipédia a été trouvé
 *   - site            : téléchargements sur livrespdfgratuits.com (petit bonus)
 *
 * Score (0 à ~1,05) : chaque source est ramenée sur 0–1 en échelle logarithmique
 * (log10(1+v) / log10(1+max de la source)), puis
 *   0,6 × max(Gutenberg, Internet Archive) + 0,4 × Wikipédia + 0,05 × site.
 *
 *   node scripts/compute-popularity.mjs            # collecte + calcul, écrit en base
 *   node scripts/compute-popularity.mjs --refresh  # re-collecte tout (sinon reprend où il en était)
 *
 * Relançable : les mesures déjà collectées (popularityData) sont réutilisées.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REFRESH = process.argv.includes("--refresh");
const UA = "livrespdfgratuits.com popularity/1.0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { json = false, tries = 3 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (r.status === 404) return null;
      if (r.ok) return json ? await r.json() : await r.text();
    } catch {
      /* réessai */
    }
    await sleep(2000 * (i + 1));
  }
  return null;
}

const books = await prisma.book.findMany({
  where: { isPublished: true },
  select: { id: true, sourceId: true, descriptionSource: true, downloadCount: true, popularityData: true },
});
const data = new Map(books.map((b) => [b.id, REFRESH ? {} : { ...(b.popularityData ?? {}) }]));
const save = async (b) => prisma.book.update({ where: { id: b.id }, data: { popularityData: data.get(b.id) } });

// ---------------------------------------------------------------- Gutenberg
const gut = books.filter((b) => b.sourceId?.startsWith("gutenberg:") && data.get(b.id).gut === undefined);
console.log(`Gutenberg : ${gut.length} livre(s) à mesurer`);
let n = 0;
for (const b of gut) {
  const id = b.sourceId.slice("gutenberg:".length);
  const rdf = await get(`https://gutenberg.pglaf.org/cache/epub/${id}/pg${id}.rdf`);
  const m = rdf?.match(/<pgterms:downloads[^>]*>(\d+)</);
  data.get(b.id).gut = m ? Number(m[1]) : 0;
  await save(b);
  if (++n % 500 === 0) console.log(`  Gutenberg ${n}/${gut.length}`);
  await sleep(120);
}

// ---------------------------------------------------------------- Internet Archive
const ia = books.filter((b) => b.sourceId && !b.sourceId.startsWith("gutenberg:") && data.get(b.id).ia === undefined);
console.log(`Internet Archive : ${ia.length} livre(s) à mesurer`);
for (let i = 0; i < ia.length; i += 50) {
  const batch = ia.slice(i, i + 50);
  const q = `identifier:(${batch.map((b) => b.sourceId).join(" OR ")})`;
  const res = await get(
    `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=downloads&rows=50&output=json`,
    { json: true }
  );
  const byId = new Map((res?.response?.docs ?? []).map((d) => [d.identifier, d.downloads ?? 0]));
  for (const b of batch) {
    data.get(b.id).ia = byId.get(b.sourceId) ?? 0;
    await save(b);
  }
  await sleep(500);
}

// ---------------------------------------------------------------- Wikipédia
const end = new Date();
const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1) - 86400000); // dernier jour du mois précédent
const startMonth = new Date(Date.UTC(endMonth.getUTCFullYear() - 1, endMonth.getUTCMonth() + 1, 1));
const fmt = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}00`;
const wiki = books.filter((b) => b.descriptionSource?.startsWith("http") && data.get(b.id).wiki === undefined);
console.log(`Wikipédia : ${wiki.length} article(s) à mesurer (${fmt(startMonth)} → ${fmt(endMonth)})`);
for (const b of wiki) {
  let views = 0;
  try {
    const u = new URL(b.descriptionSource);
    const project = u.hostname.replace(/^www\./, "").replace(".org", ""); // fr.wikipedia
    const article = u.pathname.split("/wiki/")[1];
    const res = await get(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${project}/all-access/user/${article}/monthly/${fmt(startMonth)}/${fmt(endMonth)}`,
      { json: true }
    );
    views = (res?.items ?? []).reduce((s, it) => s + (it.views ?? 0), 0);
  } catch {
    /* URL inattendue : 0 */
  }
  data.get(b.id).wiki = views;
  await save(b);
  await sleep(150);
}

// ---------------------------------------------------------------- score
const max = { gut: 1, ia: 1, wiki: 1, site: 1 };
for (const b of books) {
  const d = data.get(b.id);
  max.gut = Math.max(max.gut, d.gut ?? 0);
  max.ia = Math.max(max.ia, d.ia ?? 0);
  max.wiki = Math.max(max.wiki, d.wiki ?? 0);
  max.site = Math.max(max.site, b.downloadCount);
}
const norm = (v, m) => Math.log10(1 + (v ?? 0)) / Math.log10(1 + m);
let written = 0;
for (const b of books) {
  const d = data.get(b.id);
  const score =
    0.6 * Math.max(norm(d.gut, max.gut), norm(d.ia, max.ia)) + 0.4 * norm(d.wiki, max.wiki) + 0.05 * norm(b.downloadCount, max.site);
  d.at = new Date().toISOString().slice(0, 10);
  await prisma.book.update({ where: { id: b.id }, data: { popularity: Math.round(score * 10000) / 10000, popularityData: d } });
  written++;
}
console.log(`✓ Score calculé pour ${written} livre(s). Maximums : ${JSON.stringify(max)}`);

const top = await prisma.book.findMany({
  where: { isPublished: true },
  orderBy: { popularity: "desc" },
  take: 15,
  select: { title: true, language: true, popularity: true },
});
console.log("Top 15 :");
for (const t of top) console.log(`  ${t.popularity.toFixed(3)}  [${t.language}] ${t.title.slice(0, 60)}`);
await prisma.$disconnect();
