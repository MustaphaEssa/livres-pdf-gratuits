import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// Liste de tous les avis (approuvés + en attente) : /api/admin/avis?status=pending
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "pending" | "approved" | null

  const where =
    status === "pending"
      ? { isApproved: false }
      : status === "approved"
        ? { isApproved: true }
        : {};

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { book: { select: { title: true, slug: true } } },
  });

  return NextResponse.json({ reviews });
}
