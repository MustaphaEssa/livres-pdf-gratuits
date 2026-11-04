import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { createBook, slugExists } from "@/lib/books";
import { saveUpload, getPdfPageCount } from "@/lib/uploads-server";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Protection: réservé aux admins connectés
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format de requête invalide (multipart attendu)" },
      { status: 400 }
    );
  }

  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  let slug = String(form.get("slug") || "").trim();
  const pdf = form.get("pdf");

  if (!title || !author) {
    return NextResponse.json(
      { error: "Titre et auteur sont requis" },
      { status: 400 }
    );
  }
  if (!(pdf instanceof File)) {
    return NextResponse.json(
      { error: "Le fichier PDF est requis" },
      { status: 400 }
    );
  }

  slug = slugify(slug || title);
  if (await slugExists(slug)) {
    return NextResponse.json(
      { error: "Ce slug est déjà utilisé par un autre livre" },
      { status: 409 }
    );
  }

  // Enregistre le PDF
  const savedPdf = await saveUpload(pdf, {
    subdir: "uploads/books",
    baseName: slug,
    allowedMime: ["application/pdf"],
    extension: ".pdf",
  });
  if ("error" in savedPdf) {
    return NextResponse.json({ error: savedPdf.error }, { status: 400 });
  }

  // Image de couverture (optionnelle)
  let coverImage: string | null = null;
  const cover = form.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const savedCover = await saveUpload(cover, {
      subdir: "uploads/covers",
      baseName: slug,
      allowedMime: ["image/jpeg", "image/png", "image/webp"],
      extension: cover.type === "image/png" ? ".png" : cover.type === "image/webp" ? ".webp" : ".jpg",
      maxBytes: 5 * 1024 * 1024,
    });
    if ("error" in savedCover) {
      return NextResponse.json({ error: savedCover.error }, { status: 400 });
    }
    coverImage = savedCover.url;
  }

  // Nombre de pages : auto depuis le PDF, sinon valeur fournie
  const pageCountAuto = await getPdfPageCount(pdf);
  const pageCountField = Number(form.get("pageCount")) || null;

  const num = (v: FormDataEntryValue | null) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const bool = (v: FormDataEntryValue | null) => v === "true" || v === "on";

  try {
    const book = await createBook({
      slug,
      title,
      author,
      description: String(form.get("description") || "") || null,
      pdfUrl: savedPdf.url,
      pdfSize: savedPdf.size,
      pageCount: pageCountAuto ?? pageCountField,
      coverImage,
      language: String(form.get("language") || "fr"),
      publishedYear: num(form.get("publishedYear")),
      isbn: String(form.get("isbn") || "") || null,
      publisher: String(form.get("publisher") || "") || null,
      rating: Number(form.get("rating")) || 0,
      isFeatured: bool(form.get("isFeatured")),
      isPublished: form.get("isPublished") === null ? true : bool(form.get("isPublished")),
      categorySlug: String(form.get("categorySlug") || "") || undefined,
    });

    return NextResponse.json({ ok: true, book }, { status: 201 });
  } catch (e) {
    console.error("Création livre échouée:", e);
    return NextResponse.json(
      { error: "Erreur lors de la création du livre" },
      { status: 500 }
    );
  }
}
