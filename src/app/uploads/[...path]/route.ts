import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sert les fichiers de public/uploads ajoutés APRÈS le démarrage du serveur.
 *
 * En production (`next start`), Next.js ne sert que les fichiers de public/ présents
 * au démarrage : une couverture importée ensuite renvoie 404 jusqu'au redémarrage PM2.
 * Les fichiers connus au démarrage restent servis directement par Next ; les nouveaux
 * tombent sur cette route, qui les lit sur le disque.
 */

const ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED_DIRS = new Set(["covers", "authors", "books", "blog", "collections"]);

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".epub": "application/epub+zip",
  ".mp3": "audio/mpeg",
};

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path ?? [];
  // Refuse dossiers non prévus, fichiers cachés et toute remontée (..)
  if (parts.length < 2 || !ALLOWED_DIRS.has(parts[0]) || parts.some((p) => !p || p.startsWith("."))) {
    return notFound();
  }
  const file = path.join(ROOT, ...parts);
  if (!file.startsWith(ROOT + path.sep)) return notFound();

  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return notFound();

  let size: number;
  let mtime: Date;
  try {
    const st = await stat(file);
    if (!st.isFile()) return notFound();
    size = st.size;
    mtime = st.mtime;
  } catch {
    return notFound();
  }

  const headers = new Headers({
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Last-Modified": mtime.toUTCString(),
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  });
  if (type === "image/svg+xml") headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'");

  // Requêtes partielles (lecteur PDF, audio)
  const range = request.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    let start = m[1] ? parseInt(m[1], 10) : size - parseInt(m[2], 10);
    let end = m[1] && m[2] ? parseInt(m[2], 10) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { status: 200, headers });
}

export async function HEAD(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const res = await GET(request, ctx);
  await res.body?.cancel(); // ferme le flux de lecture ouvert par GET
  return new Response(null, { status: res.status, headers: res.headers });
}
