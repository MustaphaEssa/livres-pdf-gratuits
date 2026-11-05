import "server-only";

// Normalise un nom d'auteur type Internet Archive vers un nom affichable.
// "Hugo, Victor, 1802-1885" -> "Victor Hugo"
export function formatAuthorName(raw: string): string {
  // Retire les dates en fin de chaîne (", 1802-1885", ", 1802-", etc.)
  let s = raw.replace(/,\s*\d{3,4}\s*-?\s*\d{0,4}\.?\s*$/g, "").trim();
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  // Format "Nom, Prénom" -> "Prénom Nom"
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  return s || raw;
}

export interface AuthorInfo {
  name: string; // nom affichable
  image: string | null; // photo (Wikipédia) ou null
  bio: string | null; // courte bio ou null
}

// Récupère photo + bio d'un auteur depuis Wikipédia (FR), mis en cache 7 jours.
// Ne lève jamais : renvoie image/bio à null si introuvable.
export async function getAuthorInfo(rawName: string): Promise<AuthorInfo> {
  const name = formatAuthorName(rawName);
  try {
    const res = await fetch(
      `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      {
        headers: { "User-Agent": "livrespdfgratuits.com (contact@livrespdfgratuits.com)" },
        next: { revalidate: 60 * 60 * 24 * 7 },
      }
    );
    if (!res.ok) return { name, image: null, bio: null };
    const d = (await res.json()) as {
      type?: string;
      extract?: string;
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };
    // Évite les pages d'homonymie
    if (d.type === "disambiguation") return { name, image: null, bio: null };
    return {
      name,
      image: d.thumbnail?.source ?? d.originalimage?.source ?? null,
      bio: d.extract ?? null,
    };
  } catch {
    return { name, image: null, bio: null };
  }
}
