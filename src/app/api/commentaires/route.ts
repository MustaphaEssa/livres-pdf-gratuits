import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId requis" }, { status: 400 });
  }
  const comments = await prisma.comment.findMany({
    where: { postId, isApproved: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, content: true, createdAt: true },
  });
  return NextResponse.json({ comments });
}

const schema = z.object({
  postId: z.string().min(1),
  name: z.string().trim().max(80).optional(),
  content: z.string().trim().min(2, "Commentaire trop court").max(2000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id: parsed.data.postId } });
  if (!post) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  const session = await getUserSession();
  const name = session?.name || parsed.data.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Veuillez indiquer votre nom" },
      { status: 400 }
    );
  }

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      name,
      email: session?.email ?? null,
      content: parsed.data.content,
      isApproved: true, // auto-approuvé (modération possible plus tard)
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
