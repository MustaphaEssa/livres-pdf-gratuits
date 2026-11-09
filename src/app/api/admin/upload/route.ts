import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { saveUpload } from "@/lib/uploads-server";

export const runtime = "nodejs";

// Taille max pour une image (5 Mo) — indépendante du MAX_FILE_SIZE des PDF.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload d'une image (couverture d'article, etc.).
 * Réservé aux admins connectés. Renvoie { url } du fichier enregistré.
 */
export async function POST(request: Request) {
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

  const image = form.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
  }

  const baseName = String(form.get("name") || "image").trim();
  const extension =
    image.type === "image/png"
      ? ".png"
      : image.type === "image/webp"
        ? ".webp"
        : ".jpg";

  const saved = await saveUpload(image, {
    subdir: "uploads/covers",
    baseName,
    allowedMime: ALLOWED,
    extension,
    maxBytes: MAX_IMAGE_BYTES,
  });

  if ("error" in saved) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }

  return NextResponse.json({ url: saved.url }, { status: 201 });
}
