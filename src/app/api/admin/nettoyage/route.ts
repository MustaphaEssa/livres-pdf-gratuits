import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { fetchArchiveDownloads, publicFileSize, deleteBookFiles } from "@/lib/cleanup";

export const runtime = "nodejs";

// Cache en mémoire des téléchargements Internet Archive (une seule instance de
// l'app). Évite de réinterroger archive.org à chaque analyse et garantit que la
// suppression porte sur les mêmes chiffres que l'aperçu affiché.
let dlCache: { at: number; map: Map<string, number> } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 h

async function getDownloads(ids: string[], refresh: boolean): Promise<Map<string, number>> {
  const fresh = dlCache && Date.now() - dlCache.at < CACHE_TTL;
  if (!refresh && fresh && dlCache) {
    // Complète le cache pour d'éventuels nouveaux sourceId importés depuis
    const missing = ids.filter((id) => !dlCache!.map.has(id));
    if (missing.length) {
      const add = await fetchArchiveDownloads(missing);
      for (const [k, v] of add) dlCache.map.set(k, v);
    }
    return dlCache.map;
  }
  const map = await fetchArchiveDownloads(ids);
  dlCache = { at: Date.now(), map };
  return map;
}

// Raison pour laquelle un livre ne doit JAMAIS être supprimé automatiquement,
// sinon null. `downloads === undefined` = popularité IA inconnue → on protège
// (on ne supprime pas ce qu'on ne peut pas classer).
function protectReason(
  b: { isFeatured: boolean; downloadCount: number; viewCount: number; _count: { favorites: number } },
  downloads: number | undefined
): string | null {
  if (b.isFeatured) return "En vedette";
  if (b.downloadCount > 0) return `${b.downloadCount} téléchargement(s) sur le site`;
  if (b.viewCount > 0) return `${b.viewCount} vue(s) sur le site`;
  if (b._count.favorites > 0) return "En favori d'un utilisateur";
  if (downloads === undefined) return "Popularité Internet Archive inconnue";
  return null;
}

// GET : analyse. Renvoie tous les livres importés (sourceId non nul), classés
// du moins populaire (sur Internet Archive) au plus populaire, avec taille sur
// disque et statut « protégé » (non supprimable). Aucune suppression ici.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const refresh = new URL(request.url).searchParams.get("refresh") === "1";

  const books = await prisma.book.findMany({
    where: { sourceId: { not: null } },
    select: {
      id: true,
      slug: true,
      title: true,
      author: true,
      sourceId: true,
      pdfUrl: true,
      coverImage: true,
      downloadCount: true,
      viewCount: true,
      isFeatured: true,
      _count: { select: { favorites: true } },
    },
  });

  const ids = books.map((b) => b.sourceId).filter((s): s is string => Boolean(s));
  const downloads = await getDownloads(ids, refresh);

  const rows = await Promise.all(
    books.map(async (b) => {
      const dl = b.sourceId ? downloads.get(b.sourceId) : undefined;
      const reason = protectReason(b, dl);
      const sizeBytes =
        (await publicFileSize(b.pdfUrl)) + (await publicFileSize(b.coverImage));
      return {
        id: b.id,
        slug: b.slug,
        title: b.title,
        author: b.author,
        downloads: dl ?? null,
        sizeBytes,
        isProtected: reason !== null,
        reason,
      };
    })
  );

  // Supprimables d'abord (popularité croissante), protégés en fin de liste
  rows.sort((a, b) => {
    if (a.isProtected !== b.isProtected) return a.isProtected ? 1 : -1;
    return (a.downloads ?? Number.POSITIVE_INFINITY) - (b.downloads ?? Number.POSITIVE_INFINITY);
  });

  return NextResponse.json({
    books: rows,
    total: books.length,
    deletable: rows.filter((r) => !r.isProtected).length,
    cachedAt: dlCache?.at ?? null,
  });
}

// POST : suppression. Reçoit { ids: string[] } (la sélection validée par
// l'utilisateur). Re-vérifie côté serveur les protections « dures » (vedette /
// consulté / téléchargé / favori) avant de supprimer fichiers + ligne en base.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if (!ids.length) return NextResponse.json({ error: "Aucun livre sélectionné" }, { status: 400 });

  const books = await prisma.book.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      pdfUrl: true,
      coverImage: true,
      downloadCount: true,
      viewCount: true,
      isFeatured: true,
      _count: { select: { favorites: true } },
    },
  });

  let deleted = 0;
  let skipped = 0;
  let freedBytes = 0;

  for (const b of books) {
    // Garde-fou serveur : on ne supprime jamais un livre vedette ou qui a de
    // l'engagement, même si le client le demande.
    if (b.isFeatured || b.downloadCount > 0 || b.viewCount > 0 || b._count.favorites > 0) {
      skipped++;
      continue;
    }
    // Taille mesurée AVANT suppression des fichiers
    freedBytes += (await publicFileSize(b.pdfUrl)) + (await publicFileSize(b.coverImage));
    await deleteBookFiles(b.pdfUrl, b.coverImage);
    try {
      await prisma.book.delete({ where: { id: b.id } }); // cascade : catégories, avis, favoris…
      deleted++;
    } catch {
      skipped++;
    }
  }

  // Les livres supprimés ne sont plus dans le cache à la prochaine analyse ;
  // on purge pour forcer un recalcul propre côté popularité.
  if (deleted > 0) dlCache = null;

  return NextResponse.json({ deleted, skipped, freedBytes });
}
