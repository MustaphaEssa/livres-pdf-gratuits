import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { formatAuthorName } from "@/lib/utils";
import { upsertAuthorProfile } from "@/lib/import-archive";

export const runtime = "nodejs";

interface Job {
  status: "running" | "done" | "error";
  total: number;
  done: number;
  withPhoto: number;
  error?: string;
}

const jobs = new Map<string, Job>();

async function run(job: Job) {
  try {
    // Auteurs (d'après les livres) sans fiche photo
    const groups = await prisma.book.groupBy({
      by: ["authorSlug", "author"],
      where: { authorSlug: { not: null } },
    });
    const bySlug = new Map<string, string>();
    for (const g of groups) {
      if (g.authorSlug && !bySlug.has(g.authorSlug)) bySlug.set(g.authorSlug, g.author);
    }

    const withImage = await prisma.author.findMany({
      where: { image: { not: null } },
      select: { slug: true },
    });
    const have = new Set(withImage.map((a) => a.slug));

    const todo = Array.from(bySlug.entries()).filter(([slug]) => !have.has(slug));
    job.total = todo.length;

    for (const [slug, raw] of todo) {
      const ok = await upsertAuthorProfile(slug, formatAuthorName(raw)).catch(() => false);
      job.done++;
      if (ok) job.withPhoto++;
      await new Promise((r) => setTimeout(r, 250)); // politesse Wikipédia
    }
    job.status = "done";
  } catch (e) {
    job.status = "error";
    job.error = e instanceof Error ? e.message : "Erreur";
  }
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const id = crypto.randomUUID();
  const job: Job = { status: "running", total: 0, done: 0, withPhoto: 0 };
  jobs.set(id, job);
  if (jobs.size > 10) jobs.delete(Array.from(jobs.keys())[0]);
  void run(job);
  return NextResponse.json({ jobId: id });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("jobId");
  const job = id ? jobs.get(id) : null;
  if (!job) return NextResponse.json({ error: "Job introuvable" }, { status: 404 });
  return NextResponse.json(job);
}
