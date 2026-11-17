// Évite de compter plusieurs vues du même livre par la même IP dans un court laps
// de temps (réduit les écritures DB et gonfle moins les compteurs). En mémoire.

const seen = new Map<string, number>();
const TTL = 30 * 60 * 1000; // 30 minutes

export function shouldCountView(bookId: string, ip: string): boolean {
  return shouldCount(`v:${bookId}:${ip}`, TTL);
}

// Un même téléchargement (livre + IP) n'est compté qu'une fois par 24 h :
// les gestionnaires de téléchargement, les doubles clics et les reprises
// envoient plusieurs requêtes pour un seul fichier.
export function shouldCountDownload(bookId: string, ip: string): boolean {
  return shouldCount(`d:${bookId}:${ip}`, 24 * 60 * 60 * 1000);
}

function shouldCount(key: string, ttl: number): boolean {
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < ttl) return false;

  seen.set(key, now);

  // Nettoyage périodique pour éviter une croissance illimitée
  if (seen.size > 20000) {
    for (const [k, t] of seen) {
      const keyTtl = k.startsWith("d:") ? 24 * 60 * 60 * 1000 : TTL;
      if (now - t > keyTtl) seen.delete(k);
    }
  }
  return true;
}
