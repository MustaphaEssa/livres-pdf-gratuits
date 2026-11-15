import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { detailSelect, serializeBook, bad } from "@/lib/mobile";
import { parseAudioTracks } from "@/lib/books";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pistes d'un livre audio (URL Internet Archive, lues en streaming par l'app).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await prisma.book.findUnique({
    where: { slug },
    select: { ...detailSelect, isPublished: true, audioTracks: true, audioDuration: true },
  });
  if (!b || !b.isPublished) return bad("Livre introuvable", 404);
  const tracks = parseAudioTracks(b.audioTracks);
  if (tracks.length === 0) return bad("Pas de version audio", 404);
  return NextResponse.json({
    book: serializeBook(b),
    tracks,
    audioDuration: b.audioDuration,
  });
}
