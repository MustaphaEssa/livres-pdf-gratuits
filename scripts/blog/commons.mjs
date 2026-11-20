/**
 * Images d'articles depuis Wikimedia Commons : téléchargement (vignette 960 px),
 * hébergement local dans public/uploads/blog/, et crédit rédigé à partir des
 * métadonnées OFFICIELLES du fichier (auteur + licence), avec lien vers sa page.
 *
 * Seules les licences libres sont acceptées (domaine public, CC0, CC BY, CC BY-SA) :
 * un fichier sous une autre licence est refusé (l'image est alors simplement omise).
 *
 * Manifeste public/uploads/blog/.commons-manifest.json : métadonnées déjà récupérées.
 * Si l'image et son entrée sont présentes, AUCUN appel réseau (utile quand Commons
 * bloque le serveur : on prépare tout depuis un autre poste avec prefetch-images.mjs,
 * puis on copie le dossier sur le serveur).
 */
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "uploads", "blog");
const UA = "livrespdfgratuits.com blog-images/1.0";
const OK_LICENSE = /^(public domain|pd|cc0|no restrictions|cc by(-sa)?( \d(\.\d)?)?)/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MANIFEST = path.join(DIR, ".commons-manifest.json");

let manifest = null;
async function loadManifest() {
  if (manifest) return manifest;
  try {
    manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    manifest = {};
  }
  return manifest;
}
async function saveManifest() {
  await mkdir(DIR, { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
}
async function fileOk(p) {
  try {
    return (await stat(p)).size > 1000;
  } catch {
    return false;
  }
}

function buildCredit({ artist, license, pageUrl }, lang) {
  const pd = /^(public domain|pd|cc0|no restrictions)/i.test(license);
  const lic = pd ? (lang === "fr" ? "domaine public" : "public domain") : license;
  return `${artist ? `${artist}, ` : ""}${lic}, via [Wikimedia Commons](${pageUrl})`;
}

const strip = (html) =>
  String(html ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function api(params) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) u.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    await sleep(4000 + attempt * 20000); // Commons limite fortement les requêtes rapprochées
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    const t = await r.text();
    if (t.startsWith("{")) return JSON.parse(t);
  }
  throw new Error("API Commons indisponible");
}

/** Téléchargement avec nouvelles tentatives espacées sur 429 / 503. */
async function download(src) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await sleep(3000 + attempt * 20000);
    const r = await fetch(src, { headers: { "User-Agent": UA } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status !== 429 && r.status !== 503) throw new Error(`téléchargement HTTP ${r.status}`);
  }
  throw new Error("téléchargement refusé (trop de requêtes)");
}

/**
 * @param {string} file  « File:Nom.jpg » (ou « Nom.jpg »)
 * @param {string} base  nom local sans extension (ex. « top-films-1 »)
 * @param {"fr"|"en"} lang
 * @returns {Promise<{ url: string, credit: string } | null>}
 */
export async function commonsImage(file, base, lang = "fr") {
  const title = file.startsWith("File:") ? file : `File:${file}`;
  try {
    const m = await loadManifest();
    const known = m[base];
    if (known && known.title === title && (await fileOk(path.join(DIR, known.name)))) {
      return { url: `/uploads/blog/${known.name}`, credit: buildCredit(known, lang) };
    }
    const d = await api({
      action: "query",
      titles: title,
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime",
      iiurlwidth: "960",
      iiextmetadatafilter: "LicenseShortName|Artist",
    });
    const page = d.query?.pages?.[0];
    const info = page?.imageinfo?.[0];
    if (!info) throw new Error("fichier introuvable");
    const license = strip(info.extmetadata?.LicenseShortName?.value);
    if (!OK_LICENSE.test(license)) throw new Error(`licence non libre : ${license || "?"}`);
    const artist = strip(info.extmetadata?.Artist?.value)
      .replace(/^Unknown author/i, "")
      .replace(/["[\]()]/g, "") // ne doit pas casser la syntaxe Markdown de la légende
      .slice(0, 120)
      .trim();

    const src = info.thumburl || info.url;
    const ext = (/\.(png|jpe?g|webp|gif)(?:$|\?)/i.exec(src)?.[1] || "jpg").toLowerCase().replace("jpeg", "jpg");
    const name = `${base}.${ext}`;
    const dest = path.join(DIR, name);
    if (!(await fileOk(dest))) {
      const buf = await download(src);
      await mkdir(DIR, { recursive: true });
      await writeFile(dest, buf);
    }

    const pageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
    const meta = { title, name, artist, license, pageUrl };
    m[base] = meta;
    await saveManifest();
    return { url: `/uploads/blog/${name}`, credit: buildCredit(meta, lang) };
  } catch (e) {
    console.warn(`  image ignorée (${title}) : ${e.message}`);
    return null;
  }
}

/**
 * Remplace dans un contenu Markdown les images « ![alt](commons:File:X.jpg "légende") »
 * par l'image hébergée localement, crédit ajouté à la légende.
 * Renvoie aussi le nombre d'images refusées (l'appelant peut alors reporter la publication).
 */
export async function resolveCommonsImages(content, slug, lang = "fr") {
  const re = /!\[([^\]]*)\]\(commons:([^)"]+?)(?:\s+"([^"]*)")?\)/g;
  const found = [...content.matchAll(re)];
  let out = content;
  let n = 0;
  let failed = 0;
  for (const m of found) {
    n++;
    const img = await commonsImage(m[2].trim(), `${slug}-${n}`, lang);
    if (!img) failed++;
    out = out.replace(
      m[0],
      img ? `![${m[1]}](${img.url} "${m[3] ? `${m[3]} — ` : ""}${lang === "fr" ? "Image : " : "Image: "}${img.credit}")` : ""
    );
  }
  return { content: out, failed };
}

/** Ligne de crédit de l'image de couverture, ajoutée en fin d'article. */
export function coverCreditLine(credit, lang = "fr") {
  return lang === "fr" ? `*Image de couverture : ${credit}.*` : `*Cover image: ${credit}.*`;
}
