import "server-only";
import { stat, rm } from "fs/promises";
import path from "path";

const UA = "livrespdfgratuits.com (contact@livrespdfgratuits.com)";

// Récupère le nombre de téléchargements Internet Archive pour une liste
// d'identifiants (batché par 50 pour limiter la taille des URL). Un identifiant
// inconnu/supprimé côté archive.org reste absent de la Map (→ traité comme
// "popularité inconnue", donc protégé par l'appelant).
export async function fetchArchiveDownloads(ids: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const CHUNK = 50;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const q = `identifier:(${chunk.join(" OR ")})`;
    const url =
      "https://archive.org/advancedsearch.php?q=" +
      encodeURIComponent(q) +
      "&fl[]=identifier&fl[]=downloads&rows=" +
      chunk.length +
      "&page=1&output=json";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA } });
      clearTimeout(t);
      if (!res.ok) continue;
      const data = (await res.json()) as {
        response?: { docs?: { identifier: string; downloads?: number }[] };
      };
      for (const d of data?.response?.docs ?? []) {
        out.set(d.identifier, Number(d.downloads) || 0);
      }
    } catch {
      /* lot ignoré : ces livres restent "inconnus" donc non supprimables */
    }
  }
  return out;
}

// Taille réelle d'un fichier du dossier public (ex: "/uploads/books/x.pdf").
// 0 si le chemin est vide ou le fichier absent.
export async function publicFileSize(publicPath: string | null | undefined): Promise<number> {
  if (!publicPath) return 0;
  try {
    const s = await stat(path.join(process.cwd(), "public", publicPath));
    return s.size;
  } catch {
    return 0;
  }
}

// Supprime du disque le PDF et la couverture d'un livre (force: pas d'erreur si
// déjà absent). Ne touche jamais à la base — c'est l'appelant qui supprime la
// ligne après.
export async function deleteBookFiles(
  pdfUrl: string | null | undefined,
  coverImage: string | null | undefined
): Promise<void> {
  for (const p of [pdfUrl, coverImage]) {
    if (!p) continue;
    await rm(path.join(process.cwd(), "public", p), { force: true }).catch(() => {});
  }
}
