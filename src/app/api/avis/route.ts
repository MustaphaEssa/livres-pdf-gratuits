import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-server";
import { recomputeBookRating } from "@/lib/books";

export const runtime = "nodejs";

// Liste des avis approuvés d'un livre : /api/avis?bookId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) {
    return NextResponse.json({ error: "bookId requis" }, { status: 400 });
  }
  const reviews = await prisma.review.findMany({
    where: { bookId, isApproved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, rating: true, comment: true, createdAt: true },
  });
  return NextResponse.json({ reviews });
}

const reviewSchema = z.object({
  bookId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  name: z.string().trim().max(80).optional(),
  // Champ piège invisible : rempli → robot
  website: z.string().optional(),
});

/*
 * Anti-abus (en mémoire, process PM2 unique) :
 *  - 1 avis par livre et par adresse IP sur 24 h ;
 *  - 5 avis par heure maximum par adresse IP.
 * Le navigateur mémorise aussi les livres déjà notés (encart de notation).
 */
const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;
const byIpBook = new Map<string, number>();
const byIp = new Map<string, number[]>();

function clientIp(request: Request): string {
  const h = request.headers;
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "inconnu").trim();
}

function rateLimited(ip: string, bookId: string): boolean {
  const now = Date.now();
  const last = byIpBook.get(`${ip}|${bookId}`);
  if (last && now - last < DAY) return true;
  const recent = (byIp.get(ip) ?? []).filter((t) => now - t < HOUR);
  if (recent.length >= 5) return true;
  return false;
}

function remember(ip: string, bookId: string) {
  const now = Date.now();
  byIpBook.set(`${ip}|${bookId}`, now);
  byIp.set(ip, [...(byIp.get(ip) ?? []).filter((t) => now - t < HOUR), now]);
  if (byIpBook.size > 50_000) byIpBook.clear(); // borne mémoire
}

// Dépose un avis (utilisateur connecté ou visiteur, nom facultatif)
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  // Robot : on répond « ok » sans rien enregistrer
  if (parsed.data.website) return NextResponse.json({ ok: true, pending: false }, { status: 201 });

  const ip = clientIp(request);
  if (rateLimited(ip, parsed.data.bookId)) {
    return NextResponse.json({ error: "Vous avez déjà donné votre avis sur ce livre." }, { status: 429 });
  }

  const book = await prisma.book.findUnique({ where: { id: parsed.data.bookId }, select: { id: true } });
  if (!book) {
    return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
  }

  const session = await getUserSession();
  const name = session?.name || parsed.data.name?.trim() || null;
  const comment = parsed.data.comment || null;
  // Note seule : publiée tout de suite. Texte d'un visiteur : validé dans l'admin (/admin/avis).
  const isApproved = !comment || !!session;

  await prisma.review.create({
    data: {
      bookId: parsed.data.bookId,
      name,
      email: session?.email ?? null,
      rating: parsed.data.rating,
      comment,
      isApproved,
    },
  });
  remember(ip, parsed.data.bookId);

  if (isApproved) await recomputeBookRating(parsed.data.bookId);
  return NextResponse.json({ ok: true, pending: !isApproved }, { status: 201 });
}
