import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { createBook, slugExists } from "@/lib/books";
import { saveUpload, getPdfPageCount } from "@/lib/uploads-server";
import { slugify } from "@/lib/utils";
import prisma from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const SORTS: Record<string, Prisma.BookOrderByWithRelationInput[]> = {
  recent: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  downloads: [{ downloadCount: "desc" }, { createdAt: "desc" }],
  downloads_asc: [{ downloadCount: "asc" }, { createdAt: "desc" }],
  views: [{ viewCount: "desc" }, { createdAt: "desc" }],
  rating: [{ rating: "desc" }, { ratingCount: "desc" }],
  title: [{ title: "asc" }],
  author: [{ author: "asc" }, { title: "asc" }],
};

// Liste paginée et filtrée des livres pour l'admin
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const str = (k: string) => (sp.get(k) ?? "").trim();
  const int = (k: string) => {
    const v = sp.get(k);
    if (v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
  };

  const pageSize = [10, 25, 50, 100].includes(int("pageSize") ?? 0) ? int("pageSize")! : 25;
  const page = Math.max(1, int("page") ?? 1);

  const and: Prisma.BookWhereInput[] = [];
  const q = str("q");
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  const author = str("author");
  if (author) and.push({ author: { contains: author, mode: "insensitive" } });
  const category = str("category");
  if (category === "none") and.push({ categories: { none: {} } });
  else if (category) and.push({ categories: { some: { category: { slug: category } } } });
  const status = str("status");
  if (status === "published") and.push({ isPublished: true });
  if (status === "draft") and.push({ isPublished: false });
  if (status === "featured") and.push({ isFeatured: true });
  const media = str("media");
  if (media === "PDF" || media === "AUDIO") and.push({ mediaType: media });
  const lang = str("lang");
  if (lang) and.push({ language: lang });
  const dlMin = int("dlMin");
  const dlMax = int("dlMax");
  if (dlMin !== undefined || dlMax !== undefined) {
    and.push({ downloadCount: { gte: dlMin, lte: dlMax } });
  }
  const noCover = str("noCover") === "1";
  if (noCover) and.push({ OR: [{ coverImage: null }, { coverImage: "" }] });

  const where: Prisma.BookWhereInput = and.length ? { AND: and } : {};

  const [total, books, languages] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      orderBy: SORTS[str("sort")] ?? SORTS.recent,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        author: true,
        coverImage: true,
        language: true,
        mediaType: true,
        downloadCount: true,
        viewCount: true,
        rating: true,
        ratingCount: true,
        isPublished: true,
        isFeatured: true,
        createdAt: true,
        categories: { select: { category: { select: { name: true, slug: true } } } },
      },
    }),
    prisma.book.groupBy({ by: ["language"], _count: { _all: true }, orderBy: { language: "asc" } }),
  ]);

  return NextResponse.json({
    books,
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    languages: languages.map((l) => ({ code: l.language, count: l._count._all })),
  });
}

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
