// Déconnexion admin : supprime le cookie de session via l'API serveur.
export async function adminLogout(): Promise<void> {
  await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
}
