import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { registerDownload } from "@/lib/books";
import { bad, getMobileUser, readableWhere } from "@/lib/mobile";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// L'app appelle cette route une fois le livre téléchargé : sert uniquement aux statistiques.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = clientIp(request);
  const rl = rateLimit(`mobile-dl:${ip}`, 60, 60 * 60 * 1000);
  if (!rl.ok) return bad("Trop de requêtes", 429);

  const { slug } = await params;
  const book = await prisma.book.findFirst({
    where: { AND: [readableWhere, { slug }] },
    select: { id: true },
  });
  if (!book) return bad("Livre introuvable", 404);

  const user = await getMobileUser(request);
  await registerDownload(book.id, {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
    userId: user?.sub ?? null,
  });
  return NextResponse.json({ ok: true });
}
