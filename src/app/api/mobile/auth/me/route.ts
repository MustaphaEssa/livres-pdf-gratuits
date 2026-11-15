import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { bad, getMobileUser } from "@/lib/mobile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vérifie le jeton et renvoie le profil (l'app l'appelle au démarrage).
export async function GET(request: Request) {
  const session = await getMobileUser(request);
  if (!session) return bad("Non connecté", 401);
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user || !user.isActive) return bad("Non connecté", 401);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}

// Suppression du compte (exigée par Google Play pour les apps avec création de compte).
export async function DELETE(request: Request) {
  const session = await getMobileUser(request);
  if (!session) return bad("Non connecté", 401);
  await prisma.user.delete({ where: { id: session.sub } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
