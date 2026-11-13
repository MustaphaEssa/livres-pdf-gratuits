import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import {
  searchAuthor,
  importBook,
  searchLibrivox,
  importAudiobook,
  upsertAuthorProfile,
  freeDiskMb,
} from "@/lib/import-archive";
import { searchGutenbergAuthor, importGutenbergBook } from "@/lib/gutenberg";
import { slugify, formatAuthorName } from "@/lib/utils";

type ImportLike = {
  status: "ok" | "skip" | "duplicate" | "fail" | "replaced";
  title?: string;
  authorSlug?: string;
  authorRaw?: string;
};
type Task = { run: () => Promise<ImportLike>; downloads?: number };

export const runtime = "nodejs";

// Garde-fous (configurables par variables d'environnement)
const MAX_BOOKS_PER_AUTHOR = Number(process.env.MAX_BOOKS_PER_AUTHOR) || 400;
const MIN_FREE_DISK_MB = Number(process.env.MIN_FREE_DISK_MB) || 2000;
// Popularité minimale par défaut (nb de téléchargements IA) sous laquelle un
// livre n'est pas importé. 0 = pas de filtre. Surclassé par la valeur envoyée
// depuis l'interface.
const MIN_IMPORT_DOWNLOADS = Number(process.env.MIN_IMPORT_DOWNLOADS) || 0;

interface Job {
  id: string;
  status: "running" | "done" | "error";
  author: string; // libellé (un auteur, ou « N auteurs »)
  source: "ia" | "gutenberg";
  found: number;
  imported: number;
  replaced: number; // doublons IA remplacés par la version Gutenberg légère
  skipped: number; // doublons déjà présents
  log: string[];
  error?: string;
  cancelled?: boolean; // demande d'arrêt par l'utilisateur
}

// Jobs en mémoire (OK car une seule instance de l'app). Perdus au redémarrage.
const jobs = new Map<string, Job>();

function prune() {
  // Garde au plus 20 jobs récents
  if (jobs.size > 20) {
    const keys = Array.from(jobs.keys()).slice(0, jobs.size - 20);
    for (const k of keys) jobs.delete(k);
  }
}

// Importe les œuvres d'UN auteur dans le job (counters cumulés sur le job).
async function runOneAuthor(
  job: Job,
  author: string,
  max: number,
  categoryMap: Record<string, string>,
  importAll: boolean,
  minDownloads: number,
  isAudio: boolean,
  isGut: boolean,
  withAudio: boolean
) {
  // Marge (×4) pour compenser doublons et écarts de créateur ; en mode complet
  // on vise le plafond par auteur avec une marge suffisante.
  const rows = importAll ? Math.max(1000, max * 3) : max * 4;

  // Construit la liste de tâches d'import selon la source choisie.
  let tasks: Task[];
  if (isAudio) {
    const docs = await searchLibrivox(author, rows);
    tasks = docs.map((d) => ({
      downloads: d.downloads,
      run: () => importAudiobook(d.identifier, author, categoryMap),
    }));
    job.log.push(`${docs.length} résultat(s) audio trouvé(s) sur Internet Archive`);
  } else if (isGut) {
    const grows = await searchGutenbergAuthor(author, rows);
    tasks = grows.map((r) => ({ run: () => importGutenbergBook(r, author, categoryMap, withAudio) }));
    job.log.push(
      `${grows.length} œuvre(s) trouvée(s) dans le catalogue Project Gutenberg (fichiers légers)`
    );
  } else {
    const docs = await searchAuthor(author, rows);
    tasks = docs.map((d) => ({
      downloads: d.downloads,
      run: () => importBook(d.identifier, author, categoryMap, withAudio),
    }));
    job.log.push(
      `${docs.length} résultat(s) trouvé(s) sur Internet Archive` +
        (minDownloads > 0 ? ` · popularité min. ${minDownloads} téléch.` : "")
    );
  }
  job.found += tasks.length;

  const authorsSeen = new Map<string, string>();
  // Compteur d'ajouts propre à cet auteur (max s'applique par auteur).
  let addedThisAuthor = 0;
  for (const task of tasks) {
    if (addedThisAuthor >= max) break;
    if (job.cancelled) {
      job.log.push("⏹️ Import arrêté par l'utilisateur.");
      break;
    }
    // Seuil de popularité (IA uniquement : les résultats sont triés par
    // téléchargements décroissants → dès qu'on passe sous le seuil, fin).
    if (minDownloads > 0 && typeof task.downloads === "number" && task.downloads < minDownloads) {
      job.log.push(
        `⏹️ Popularité minimale atteinte (${task.downloads} < ${minDownloads} téléch.) — fin pour cet auteur.`
      );
      break;
    }
    // Stoppe avant de saturer le disque du serveur (PDF seulement : l'audio
    // est diffusé en streaming, rien n'est téléchargé).
    if (!isAudio && MIN_FREE_DISK_MB > 0) {
      const free = await freeDiskMb();
      if (free !== null && free < MIN_FREE_DISK_MB) {
        job.cancelled = true;
        job.log.push(
          `⚠️ Espace disque faible (${free} Mo restants) — import interrompu pour préserver le serveur.`
        );
        break;
      }
    }
    try {
      const res = await task.run();
      if (res.status === "ok") {
        job.imported++;
        addedThisAuthor++;
        job.log.push(`✓ Importé : ${res.title}`);
        if (res.authorSlug && res.authorRaw) authorsSeen.set(res.authorSlug, res.authorRaw);
      } else if (res.status === "replaced") {
        job.replaced++;
        addedThisAuthor++;
        job.log.push(`♻️ Allégé (scan → Gutenberg) : ${res.title}`);
        if (res.authorSlug && res.authorRaw) authorsSeen.set(res.authorSlug, res.authorRaw);
      } else if (res.status === "duplicate") {
        job.skipped++;
        job.log.push(`⏭️ Doublon (déjà présent) : ${res.title}`);
      }
    } catch {
      /* on saute les échecs */
    }
    if (job.log.length > 300) job.log.splice(0, job.log.length - 300);
  }

  // Fiches auteur + statut « à jour » : pour les PDF uniquement (flux audio
  // orienté catalogue LibriVox, la recherche peut porter sur un titre).
  if (!isAudio) {
    // Toujours (re)créer la fiche de l'auteur recherché — même si tous les
    // livres existaient déjà (anti-doublon) → garantit la photo/bio.
    const searchedName = formatAuthorName(author);
    authorsSeen.set(slugify(searchedName), searchedName);

    for (const [slug, raw] of authorsSeen) {
      await upsertAuthorProfile(slug, raw).catch(() => {});
    }

    // Marque l'auteur « à jour » si un import COMPLET non interrompu n'a rien
    // ramené de nouveau (tout son corpus disponible est déjà en base).
    if (importAll && !job.cancelled) {
      await prisma.author
        .update({
          where: { slug: slugify(searchedName) },
          data: { fullyImported: addedThisAuthor === 0 },
        })
        .catch(() => {});
    }
  }
}

async function run(
  job: Job,
  authors: string[],
  max: number,
  categoryMap: Record<string, string>,
  importAll: boolean,
  minDownloads: number,
  mediaType: "PDF" | "AUDIO" = "PDF",
  source: "ia" | "gutenberg" = "ia",
  withAudio = false
) {
  const isAudio = mediaType === "AUDIO";
  const isGut = source === "gutenberg" && !isAudio;
  const multi = authors.length > 1;
  try {
    for (let i = 0; i < authors.length; i++) {
      if (job.cancelled) break;
      const author = authors[i];
      if (multi) job.log.push(`\n━━ Auteur ${i + 1}/${authors.length} : ${author} ━━`);
      await runOneAuthor(
        job,
        author,
        max,
        categoryMap,
        importAll,
        minDownloads,
        isAudio,
        isGut,
        withAudio
      );
    }

    job.status = "done";
    const parts = [`${job.imported} importé(s)`];
    if (job.replaced > 0) parts.push(`${job.replaced} allégé(s)`);
    parts.push(`${job.skipped} doublon(s) ignoré(s)`);
    job.log.push(`${job.cancelled ? "⏹️ Arrêté" : "✅ Terminé"} : ${parts.join(", ")}.`);
  } catch (e) {
    job.status = "error";
    job.error = e instanceof Error ? e.message : "Erreur inconnue";
  }
}

// Démarre un import (retourne un jobId à suivre via GET)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Liste d'auteurs : soit `authors` (tableau), soit `author` (texte, une ou
  // plusieurs lignes). On découpe par ligne, nettoie et dédoublonne.
  const rawAuthors: string[] = Array.isArray(body.authors)
    ? (body.authors as unknown[]).map((a) => String(a))
    : String(body.author || "").split(/\r?\n/);
  const seenAuthors = new Set<string>();
  const authors: string[] = [];
  for (const a of rawAuthors) {
    const name = a.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seenAuthors.has(key)) continue;
    seenAuthors.add(key);
    authors.push(name);
  }
  const author = authors[0] ?? "";
  const mediaType: "PDF" | "AUDIO" =
    body.mediaType === "audio" || body.mediaType === "AUDIO" ? "AUDIO" : "PDF";
  // Source d'import : Gutenberg (fichiers légers, PDF généré) ou Internet
  // Archive (scans). L'audio provient toujours d'Internet Archive (LibriVox).
  const source: "ia" | "gutenberg" =
    body.source === "gutenberg" && mediaType !== "AUDIO" ? "gutenberg" : "ia";
  // Audio en même temps : attache un livre audio LibriVox correspondant à la
  // fiche PDF/EPUB (par défaut activé ; sans objet pour un import audio pur).
  const withAudio = body.withAudio !== false && mediaType !== "AUDIO";
  const importAll = body.all === true;
  // Mode « tout importer » : plafond par auteur (évite de saturer le VPS avec un
  // auteur à plusieurs centaines d'œuvres) ; sinon la valeur demandée.
  const max = importAll
    ? MAX_BOOKS_PER_AUTHOR
    : Math.min(300, Math.max(1, Number(body.max) || 20));
  // Popularité minimale : valeur de l'interface si fournie, sinon défaut serveur
  const minDownloads =
    body.minDownloads !== undefined
      ? Math.max(0, Number(body.minDownloads) || 0)
      : MIN_IMPORT_DOWNLOADS;
  if (!authors.length)
    return NextResponse.json(
      { error: mediaType === "AUDIO" ? "Terme de recherche requis" : "Nom d'auteur requis" },
      { status: 400 }
    );

  // Carte slug -> id des catégories de livres (pour la détection automatique)
  const cats = await prisma.category.findMany({
    where: { type: "BOOK" },
    select: { slug: true, id: true },
  });
  const categoryMap: Record<string, string> = {};
  for (const c of cats) categoryMap[c.slug] = c.id;

  const id = crypto.randomUUID();
  const job: Job = {
    id,
    status: "running",
    author: authors.length === 1 ? authors[0] : `${authors.length} auteurs`,
    source,
    found: 0,
    imported: 0,
    replaced: 0,
    skipped: 0,
    log: [],
  };
  jobs.set(id, job);
  prune();
  // Lance en arrière-plan (pas de await) — le serveur Node persistant poursuit la tâche
  void run(job, authors, max, categoryMap, importAll, minDownloads, mediaType, source, withAudio);

  return NextResponse.json({ jobId: id });
}

// Suivi de l'avancement d'un import
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("jobId");
  const job = id ? jobs.get(id) : null;
  if (!job) return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  return NextResponse.json(job);
}

// Demande l'arrêt d'un import en cours (la boucle s'interrompt proprement
// avant le prochain livre — les livres déjà importés sont conservés).
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("jobId");
  const job = id ? jobs.get(id) : null;
  if (!job) return NextResponse.json({ error: "Job introuvable" }, { status: 404 });

  if (job.status === "running") job.cancelled = true;
  return NextResponse.json({ ok: true });
}
