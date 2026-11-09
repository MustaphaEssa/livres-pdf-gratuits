import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import {
  getCollectionById,
  updateCollection,
  deleteCollection,
  slugExistsCollection,
  type CollectionInput,
} from "@/lib/collections";

export const runtime = "nodejs";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const collection = await getCollectionById(id);
  if (!collection) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ collection });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  let body: CollectionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (body.slug && (await slugExistsCollection(body.slug, id))) {
    return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 });
  }

  const collection = await updateCollection(id, body);
  return NextResponse.json({ collection });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  await deleteCollection(id);
  return NextResponse.json({ ok: true });
}
