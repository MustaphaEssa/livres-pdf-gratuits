import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { slugify } from "@/lib/utils";

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 52428800; // 50 Mo

export interface SavedFile {
  url: string; // chemin public (ex: /uploads/books/xxx.pdf)
  size: number; // octets
}

export type SaveError = { error: string };

// Enregistre un fichier téléversé dans public/<subdir>, en validant type et taille.
export async function saveUpload(
  file: File,
  options: {
    subdir: string; // ex: "uploads/books"
    baseName: string; // ex: slug du livre
    allowedMime: string[];
    extension: string; // ex: ".pdf"
    maxBytes?: number;
  }
): Promise<SavedFile | SaveError> {
  const maxBytes = options.maxBytes ?? MAX_FILE_SIZE;

  if (file.size === 0) return { error: "Fichier vide" };
  if (file.size > maxBytes) {
    return {
      error: `Fichier trop volumineux (max ${Math.round(maxBytes / 1024 / 1024)} Mo)`,
    };
  }
  if (options.allowedMime.length && !options.allowedMime.includes(file.type)) {
    return { error: `Type de fichier non autorisé (${file.type || "inconnu"})` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeBase = slugify(options.baseName) || "fichier";
  const fileName = `${safeBase}-${Date.now()}${options.extension}`;

  const dir = path.join(process.cwd(), "public", options.subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);

  return { url: `/${options.subdir}/${fileName}`, size: file.size };
}

// Compte les pages d'un PDF (renvoie null si échec).
export async function getPdfPageCount(file: File): Promise<number | null> {
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data,
      isEvalSupported: false,
      useWorkerFetch: false,
    }).promise;
    const n = doc.numPages;
    await doc.destroy();
    return n;
  } catch {
    return null;
  }
}
