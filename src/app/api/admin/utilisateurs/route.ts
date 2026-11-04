import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// Liste des utilisateurs du site public (avec compteurs favoris/téléchargements)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      _count: { select: { favorites: true, downloads: true } },
    },
  });

  return NextResponse.json({ users });
}
