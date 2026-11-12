import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getBookBySlug } from "@/lib/books";

export const runtime = "nodejs";

/**
 * Sert le PDF d'un livre EN LIGNE (affichage dans le lecteur), même origine.
 *
 * - PDF externe (archive.org) : proxy côté serveur, avec passthrough des
 *   requêtes Range (chargement progressif de pdf.js). Indispensable car
 *   archive.org n'envoie pas d'en-tête CORS : le navigateur ne peut pas
 *   charger le PDF directement.
 * - PDF local (legacy) : lecture depuis public/uploads.
 *
 * Le téléchargement « forcé » reste géré par /livre/[slug]/telecharger.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book || !book.pdfUrl) {
    return new NextResponse("Introuvable", { status: 404 });
  }

  // --- PDF externe : proxy avec support Range ---
  if (/^https?:\/\//i.test(book.pdfUrl)) {
    const range = request.headers.get("range");
    let upstream: Response;
    try {
      upstream = await fetch(book.pdfUrl, {
        headers: {
          ...(range ? { Range: range } : {}),
          "User-Agent": "livrespdfgratuits.com (reader-proxy)",
        },
        redirect: "follow",
      });
    } catch {
      return new NextResponse("Source indisponible", { status: 502 });
    }
    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse("Source indisponible", { status: 502 });
    }
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", "inline");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=86400");
    const cl = upstream.headers.get("content-length");
    const cr = upstream.headers.get("content-range");
    if (cl) headers.set("Content-Length", cl);
    if (cr) headers.set("Content-Range", cr);
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  }

  // --- PDF local (legacy) ---
  try {
    const relative = book.pdfUrl.replace(/^\/+/, "");
    const filePath = path.join(process.cwd(), "public", relative);
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Content-Length": String(file.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Fichier introuvable", { status: 404 });
  }
}
