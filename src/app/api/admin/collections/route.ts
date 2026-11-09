import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import {
  getAllCollections,
  createCollection,
  slugExistsCollection,
  type CollectionInput,
} from "@/lib/collections";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const collections = await getAllCollections();
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: CollectionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const slug = (body.slug?.trim() || slugify(title)) as string;
  if (await slugExistsCollection(slug)) {
    return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 400 });
  }

  const collection = await createCollection({ ...body, title, slug });
  return NextResponse.json({ collection }, { status: 201 });
}
