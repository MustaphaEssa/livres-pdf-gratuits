/**
 * Attache un livre audio LibriVox aux livres (PDF) DÉJÀ présents, quand une
 * correspondance stricte titre + auteur existe. Le livre garde son PDF : la
 * même fiche proposera alors lecture PDF/EPUB ET écoute audio (modèle bdebooks).
 *
 *   node scripts/backfill-audio.mjs            # applique
 *   node scripts/backfill-audio.mjs --dry-run  # prévisualise sans modifier
 *
 * Correspondance sûre uniquement : nom d'auteur présent + ≥70 % des mots du
 * titre + présence de fichiers audio. Relançable sans risque (ignore les
 * livres qui ont déjà des pistes audio).
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DRY = process.argv.includes("--dry-run");
const UA = "livrespdfgratuits.com (backfill-audio)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "et", "ou", "a", "au",
  "aux", "en", "par", "pour", "avec", "sur", "dans", "the", "of", "and", "to",
  "tome", "volume", "vol", "texte", "integral", "edition", "preface", "suivi",
]);

function norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const tokens = (s) => norm(s).split(" ").filter((t) => t.length >= 3 && !STOP.has(t));
function surname(author) {
  const p = norm(author).split(" ").filter(Boolean);
  return p.length ? p[p.length - 1] : "";
}
const oneStr = (v) => (Array.isArray(v) ? (v.length ? String(v[0]) : "") : v == null ? "" : String(v));
const parseLength = (raw) => {
  const s = oneStr(raw);
  if (!s) return 0;
  if (s.includes(":")) return s.split(":").map((x) => parseInt(x, 10) || 0).reduce((a, v) => a * 60 + v, 0);
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

function buildTracks(identifier, files) {
  const preferred = ["128Kbps MP3", "VBR MP3", "64Kbps MP3"];
  let chosen = files.filter((f) => f.format && preferred.includes(f.format));
  if (chosen.length) {
    const fmt = preferred.find((p) => chosen.some((f) => f.format === p));
    chosen = chosen.filter((f) => f.format === fmt);
  } else {
    chosen = files.filter((f) => /\.mp3$/i.test(f.name));
  }
  if (!chosen.length) return null;
  const trackNum = (f) => {
    const t = parseInt(oneStr(f.track), 10);
    if (Number.isFinite(t)) return t;
    const m = f.name.match(/_(\d{1,4})[_.]/);
    return m ? parseInt(m[1], 10) : 0;
  };
  chosen.sort((a, b) => trackNum(a) - trackNum(b) || a.name.localeCompare(b.name));
  const tracks = chosen.map((f, i) => ({
    title: oneStr(f.title) || f.name.replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ") || `Chapitre ${i + 1}`,
    url: `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`,
    duration: parseLength(f.length),
  }));
  return { tracks, duration: tracks.reduce((a, t) => a + t.duration, 0) };
}

async function findAudio(book) {
  const tTokens = tokens(book.title).slice(0, 8);
  const sn = surname(book.author);
  if (!tTokens.length || !sn) return null;
  const q = `title:(${tTokens.join(" AND ")}) AND creator:(${sn}) AND collection:(librivoxaudio) AND mediatype:(audio)`;
  const url =
    "https://archive.org/advancedsearch.php?q=" + encodeURIComponent(q) +
    "&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=downloads&sort[]=downloads+desc&rows=5&page=1&output=json";
  let docs = [];
  try {
    docs = (await fetchJson(url))?.response?.docs ?? [];
  } catch {
    return null;
  }
  for (const d of docs) {
    const candTitle = new Set(tokens(oneStr(d.title)));
    if (!norm(oneStr(d.creator)).includes(sn)) continue;
    const ratio = tTokens.filter((t) => candTitle.has(t)).length / tTokens.length;
    if (ratio < 0.7) continue;
    try {
      const meta = await fetchJson(`https://archive.org/metadata/${d.identifier}`);
      const built = buildTracks(d.identifier, meta?.files ?? []);
      if (built && built.tracks.length) {
        return { identifier: d.identifier, ...built, candTitle: oneStr(d.title), ratio };
      }
    } catch {
      /* suivant */
    }
    await sleep(200);
  }
  return null;
}

async function main() {
  const books = await prisma.book.findMany({
    where: { mediaType: "PDF", OR: [{ audioTracks: null }, { audioTracks: "" }] },
    select: { id: true, title: true, author: true },
  });
  console.log(`${books.length} livre(s) PDF à enrichir en audio…${DRY ? " (DRY-RUN)" : ""}`);

  let matched = 0;
  let i = 0;
  for (const b of books) {
    i++;
    const m = await findAudio(b);
    if (m) {
      matched++;
      console.log(
        `✓ [${i}/${books.length}] "${b.title.slice(0, 40)}" → audio "${m.candTitle.slice(0, 40)}" (${m.tracks.length} ch., ${Math.round(m.ratio * 100)}%)`
      );
      if (!DRY) {
        await prisma.book.update({
          where: { id: b.id },
          data: {
            audioSourceId: m.identifier,
            audioTracks: JSON.stringify(m.tracks),
            audioDuration: m.duration,
          },
        });
      }
    }
    await sleep(300);
  }
  console.log(`\nTerminé : ${matched} livre(s) enrichi(s) en audio sur ${books.length}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
