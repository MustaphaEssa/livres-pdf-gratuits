"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-modal";

/**
 * Page de repli pour les liens directs /auth/connexion et /auth/inscription
 * (ex. redirection serveur depuis /compte). La connexion se fait au popup ;
 * cette page l'ouvre automatiquement et renvoie vers `from` après succès.
 */
export default function AuthLanding({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loadingUser, openAuth } = useAuth();
  const opened = useRef(false);

  const from = params.get("from") || "/compte";

  // Déjà connecté → on file directement à la destination
  useEffect(() => {
    if (!loadingUser && user) router.replace(from);
  }, [loadingUser, user, from, router]);

  const open = () =>
    openAuth({ mode, onSuccess: () => router.replace(from) });

  // Ouvre le popup une fois au chargement (si pas connecté)
  useEffect(() => {
    if (!loadingUser && !user && !opened.current) {
      opened.current = true;
      open();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser, user]);

  return (
    <div className="wrap" style={{ padding: "64px 32px", textAlign: "center" }}>
      <h1 style={{ fontSize: 30, marginBottom: 12 }}>
        {mode === "signin" ? "Connexion" : "Créer un compte"}
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        {mode === "signin"
          ? "Connectez-vous pour accéder à vos livres et vos favoris."
          : "Créez un compte gratuit pour garder vos livres et vos favoris."}
      </p>
      <button type="button" className="btn btn-primary btn-lg" onClick={open}>
        {mode === "signin" ? "Se connecter" : "Créer un compte"}
      </button>
    </div>
  );
}
