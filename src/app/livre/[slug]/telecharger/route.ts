import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getBookBySlug, registerDownload } from "@/lib/books";
import { getUserSession } from "@/lib/user-server";
import { slugify } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book || !book.pdfUrl) {
    return new NextResponse("Livre introuvable", { status: 404 });
  }

  // Comptabilise le téléchargement (compteur + journal)
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");
  const session = await getUserSession();
  try {
    await registerDownload(book.id, {
      ipAddress,
      userAgent,
      userId: session?.sub ?? null,
    });
  } catch (e) {
    // On ne bloque pas le téléchargement si le comptage échoue
    console.error("registerDownload error:", e);
  }

  // PDF externe -> simple redirection
  if (/^https?:\/\//i.test(book.pdfUrl)) {
    return NextResponse.redirect(book.pdfUrl);
  }

  // PDF local servi depuis /public en pièce jointe (téléchargement forcé)
  try {
    const relative = book.pdfUrl.replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), "public", relative);
    const file = await readFile(filePath);
    const fileName = `${slugify(book.title)}.pdf`;

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(file.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Lecture du PDF impossible:", e);
    return new NextResponse(
      "Le fichier PDF de ce livre est introuvable.",
      { status: 404 }
    );
  }
}
