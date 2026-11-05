import "server-only";
import prisma from "@/lib/db";
import { formatAuthorName } from "@/lib/utils";

// Ré-export pour compatibilité des imports existants
export { formatAuthorName };

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
