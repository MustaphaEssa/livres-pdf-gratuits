import { unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import {
  getBookById,
  updateBook,
  deleteBook,
  slugExists,
  type UpdateBookInput,
} from "@/lib/books";
import { saveUpload } from "@/lib/uploads-server";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

// Supprime un fichier local du dossier public/uploads (ignore les erreurs)
async function removeLocalUpload(url: string | null | undefined) {
  if (url && url.startsWith("/uploads/")) {
    try {
      await unlink(path.join(process.cwd(), "public", url.replace(/^\/+/, "")));
    } catch {
      /* fichier déjà absent : on ignore */
    }
  }
}

// Met à jour un livre. Accepte soit du JSON (métadonnées + toggles), soit du
// multipart/form-data lorsqu'une nouvelle image de couverture est téléversée.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getBookById(id);
  if (!existing) {
    return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
  }

  // Lecture du corps : multipart (avec couverture) ou JSON
  const contentType = request.headers.get("content-type") || "";
  const body: Record<string, unknown> = {};
  let newCoverUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    // Champs texte
    for (const key of [
      "title", "author", "slug", "description", "language",
      "isbn", "publisher", "publishedYear", "pageCount", "categorySlug",
    ]) {
      const v = form.get(key);
      if (v !== null) body[key] = typeof v === "string" ? v : undefined;
    }
    // Les cases à cocher n'arrivent que si présentes : on les lit explicitement
    if (form.get("isPublished") !== null) body.isPublished = form.get("isPublished") === "true";
    if (form.get("isFeatured") !== null) body.isFeatured = form.get("isFeatured") === "true";

    // Nouvelle couverture éventuelle
    const cover = form.get("cover");
    if (cover instanceof File && cover.size > 0) {
      const slugForName = (typeof body.slug === "string" && body.slug) || existing.slug;
      const savedCover = await saveUpload(cover, {
        subdir: "uploads/covers",
        baseName: slugForName,
        allowedMime: ["image/jpeg", "image/png", "image/webp"],
        extension: cover.type === "image/png" ? ".png" : cover.type === "image/webp" ? ".webp" : ".jpg",
        maxBytes: 5 * 1024 * 1024,
      });
      if ("error" in savedCover) {
        return NextResponse.json({ error: savedCover.error }, { status: 400 });
      }
      newCoverUrl = savedCover.url;
    }
  } else {
    try {
      Object.assign(body, await request.json());
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
  }

  const data: UpdateBookInput = {};
  if (newCoverUrl) data.coverImage = newCoverUrl;
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.author === "string") data.author = body.author.trim();
  if (typeof body.description === "string")
    data.description = body.description || null;
  if (typeof body.language === "string") data.language = body.language;
  if (typeof body.isbn === "string") data.isbn = body.isbn || null;
  if (typeof body.publisher === "string") data.publisher = body.publisher || null;
  if (body.publishedYear !== undefined)
    data.publishedYear = Number(body.publishedYear) || null;
  if (body.pageCount !== undefined)
    data.pageCount = Number(body.pageCount) || null;
  if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
  if (typeof body.categorySlug === "string") data.categorySlug = body.categorySlug;

  // Slug : si fourni/modifié, le normaliser et vérifier l'unicité
  if (typeof body.slug === "string" && body.slug.trim()) {
    const newSlug = slugify(body.slug);
    if (newSlug !== existing.slug) {
      if (await slugExists(newSlug, id)) {
        return NextResponse.json(
          { error: "Ce slug est déjà utilisé" },
          { status: 409 }
        );
      }
      data.slug = newSlug;
    }
  }

  try {
    const book = await updateBook(id, data);
    // Supprime l'ancienne couverture locale remplacée
    if (newCoverUrl && existing.coverImage && existing.coverImage !== newCoverUrl) {
      await removeLocalUpload(existing.coverImage);
    }
    return NextResponse.json({ ok: true, book });
  } catch (e) {
    console.error("Mise à jour livre échouée:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Supprime un livre et ses fichiers (PDF + couverture)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const book = await deleteBook(id);
  if (!book) {
    return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
  }

  // Supprime les fichiers locaux associés
  await removeLocalUpload(book.pdfUrl);
  await removeLocalUpload(book.coverImage);

  return NextResponse.json({ ok: true });
}

// (lecture simple, utile pour le formulaire d'édition côté client si besoin)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) {
    return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
  }
  return NextResponse.json({ book });
}
