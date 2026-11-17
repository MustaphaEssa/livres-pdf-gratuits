import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getBookBySlug, registerDownload } from "@/lib/books";
import { getUserSession } from "@/lib/user-server";
import { slugify } from "@/lib/utils";
import { isBot } from "@/lib/bot";
import { shouldCountDownload } from "@/lib/view-throttle";

// Les requêtes HEAD (aperçus de liens, gestionnaires de téléchargement) ne
// doivent ni servir le fichier ni compter un téléchargement.
export function HEAD() {
  return new NextResponse(null, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Ignore les requêtes de préchargement (Next ou navigateur) : on ne sert pas
  // le PDF et on ne comptabilise pas un faux téléchargement.
  const h = request.headers;
  const isPrefetch =
    h.get("next-router-prefetch") === "1" ||
    h.get("purpose") === "prefetch" ||
    (h.get("sec-purpose") ?? "").includes("prefetch");
  if (isPrefetch) {
    return new NextResponse(null, { status: 204 });
  }

  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book || !book.pdfUrl) {
    return new NextResponse("Livre introuvable", { status: 404 });
  }

  // Comptabilise le téléchargement (compteur + journal), uniquement pour un
  // humain : pas les robots, pas les requêtes partielles (Range) envoyées par
  // les gestionnaires de téléchargement, et une seule fois par livre/IP/24 h.
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent");
  const range = h.get("range");
  const isPartial = !!range && !/^bytes=0-/.test(range);
  if (
    !isBot(userAgent) &&
    !isPartial &&
    // IP + navigateur : deux personnes derrière la même IP (réseau mobile,
    // wifi public) restent comptées séparément si leurs appareils diffèrent.
    shouldCountDownload(book.id, `${ipAddress ?? "unknown"}|${userAgent ?? ""}`)
  ) {
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
