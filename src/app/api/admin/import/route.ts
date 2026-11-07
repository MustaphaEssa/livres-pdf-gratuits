import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { searchAuthor, importBook, upsertAuthorProfile } from "@/lib/import-archive";
import { slugify, formatAuthorName } from "@/lib/utils";

export const runtime = "nodejs";

interface Job {
  id: string;
  status: "running" | "done" | "error";
  author: string;
  found: number;
  imported: number;
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

async function run(
  job: Job,
  author: string,
  max: number,
  categoryMap: Record<string, string>,
  importAll: boolean
) {
  try {
    // En mode « tout importer » on récupère l'intégralité du corpus de l'auteur ;
    // sinon on prend une marge (max*4) pour compenser doublons et écarts.
    const rows = importAll ? 5000 : max * 4;
    const docs = await searchAuthor(author, rows);
    job.found = docs.length;
    job.log.push(`${docs.length} résultat(s) trouvé(s) sur Internet Archive`);

    const authorsSeen = new Map<string, string>();
    for (const doc of docs) {
      if (job.imported >= max) break;
      if (job.cancelled) {
        job.log.push("⏹️ Import arrêté par l'utilisateur.");
        break;
      }
      try {
        const res = await importBook(doc.identifier, author, categoryMap);
        if (res.status === "ok") {
          job.imported++;
          job.log.push(`✓ Importé : ${res.title}`);
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
          data: { fullyImported: job.imported === 0 },
        })
        .catch(() => {});
    }

    job.status = "done";
    job.log.push(
      `${job.cancelled ? "⏹️ Arrêté" : "✅ Terminé"} : ${job.imported} importé(s), ${job.skipped} doublon(s) ignoré(s).`
    );
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

  const author = String(body.author || "").trim();
  const importAll = body.all === true;
  // Mode « tout importer » : plafond haut (corpus complet) ; sinon valeur demandée
  const max = importAll ? 5000 : Math.min(300, Math.max(1, Number(body.max) || 20));
  if (!author) return NextResponse.json({ error: "Nom d'auteur requis" }, { status: 400 });

  // Carte slug -> id des catégories de livres (pour la détection automatique)
  const cats = await prisma.category.findMany({
    where: { type: "BOOK" },
    select: { slug: true, id: true },
  });
  const categoryMap: Record<string, string> = {};
  for (const c of cats) categoryMap[c.slug] = c.id;

  const id = crypto.randomUUID();
  const job: Job = { id, status: "running", author, found: 0, imported: 0, skipped: 0, log: [] };
  jobs.set(id, job);
  prune();
  // Lance en arrière-plan (pas de await) — le serveur Node persistant poursuit la tâche
  void run(job, author, max, categoryMap, importAll);

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
