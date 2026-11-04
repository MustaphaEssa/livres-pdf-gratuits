// Helpers client pour la session utilisateur public.

export interface CurrentUser {
  name: string;
  email: string;
}

// Récupère l'utilisateur connecté, ou null.
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.authenticated ? (data.user as CurrentUser) : null;
  } catch {
    return null;
  }
}

// Déconnexion : supprime le cookie de session via l'API serveur.
export async function userLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}
