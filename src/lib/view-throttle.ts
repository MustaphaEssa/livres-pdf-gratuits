// Évite de compter plusieurs vues du même livre par la même IP dans un court laps
// de temps (réduit les écritures DB et gonfle moins les compteurs). En mémoire.

const seen = new Map<string, number>();
const TTL = 30 * 60 * 1000; // 30 minutes

export function shouldCountView(bookId: string, ip: string): boolean {
  const key = `${bookId}:${ip}`;
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < TTL) return false;

  seen.set(key, now);

  // Nettoyage périodique pour éviter une croissance illimitée
  if (seen.size > 5000) {
    for (const [k, t] of seen) {
      if (now - t > TTL) seen.delete(k);
    }
  }
  return true;
}
