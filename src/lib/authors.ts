import "server-only";
import prisma from "@/lib/db";

// Normalise un nom d'auteur type Internet Archive vers un nom affichable.
// "Hugo, Victor, 1802-1885" -> "Victor Hugo"
export function formatAuthorName(raw: string): string {
  const s = raw
    .replace(/\[.*?\]/g, "")
    .replace(/\d{3,4}\s*-\s*\d{0,4}/g, "")
    .replace(/[;,]\s*$/g, "")
    .trim();
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return (parts[0] || s || raw).trim();
}

export interface AuthorInfo {
  name: string;
  image: string | null;
  bio: string | null;
  birthYear: number | null;
  deathYear: number | null;
}

// Fiche auteur depuis la base (photo + bio + dates, stockées localement).
// Repli sur le nom formaté si aucune fiche n'existe encore.
export async function getAuthorInfo(
  slug: string,
  fallbackRawName: string
): Promise<AuthorInfo> {
  const a = await prisma.author.findUnique({ where: { slug } });
  if (a) {
    return {
      name: a.name,
      image: a.image,
      bio: a.bio,
      birthYear: a.birthYear,
      deathYear: a.deathYear,
    };
  }
  return {
    name: formatAuthorName(fallbackRawName),
    image: null,
    bio: null,
    birthYear: null,
    deathYear: null,
  };
}
