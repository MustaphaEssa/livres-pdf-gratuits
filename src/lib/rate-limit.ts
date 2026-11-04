// Limiteur de débit en mémoire (par instance). Suffisant pour un VPS mono-instance.
// Pour un déploiement multi-instances, remplacer par Redis.

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // secondes avant réinitialisation
  remaining: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      remaining: 0,
    };
  }
  return { ok: true, retryAfter: 0, remaining: limit - entry.count };
}

// Réinitialise le compteur (ex: après une connexion réussie)
export function resetRateLimit(key: string): void {
  store.delete(key);
}

// Extrait l'IP cliente depuis les en-têtes de la requête
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
