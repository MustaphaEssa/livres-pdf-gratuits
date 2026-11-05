import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { searchAuthor, importBook, upsertAuthorProfile } from "@/lib/import-archive";

export const runtime = "nodejs";

interface Job {
  id: string;
  status: "running" | "done" | "error";
  author: string;
  found: number;
  imported: number;
  log: string[];
  error?: string;
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

async function run(job: Job, author: string, max: number, catId: string | null) {
  try {
    const docs = await searchAuthor(author, max * 4);
    job.found = docs.length;
    job.log.push(`${docs.length} résultat(s) trouvé(s) sur Internet Archive`);

    const authorsSeen = new Map<string, string>();
    for (const doc of docs) {
      if (job.imported >= max) break;
      try {
        const res = await importBook(doc.identifier, author, catId);
        if (res.status === "ok") {
          job.imported++;
          job.log.push(`✓ ${res.title}`);
          if (res.authorSlug && res.authorRaw) authorsSeen.set(res.authorSlug, res.authorRaw);
        }
      } catch {
        /* on saute les échecs */
      }
      if (job.log.length > 300) job.log.splice(0, job.log.length - 300);
    }

    for (const [slug, raw] of authorsSeen) {
      await upsertAuthorProfile(slug, raw).catch(() => {});
    }

    job.status = "done";
    job.log.push(`✅ Terminé : ${job.imported} livre(s) importé(s).`);
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
  const category = String(body.category || "").trim();
  const max = Math.min(50, Math.max(1, Number(body.max) || 20));
  if (!author) return NextResponse.json({ error: "Nom d'auteur requis" }, { status: 400 });

  let catId: string | null = null;
  if (category) {
    const c = await prisma.category.findUnique({ where: { slug: category } });
    catId = c?.id ?? null;
  }

  const id = crypto.randomUUID();
  const job: Job = { id, status: "running", author, found: 0, imported: 0, log: [] };
  jobs.set(id, job);
  prune();
  // Lance en arrière-plan (pas de await) — le serveur Node persistant poursuit la tâche
  void run(job, author, max, catId);

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
