"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchCurrentUser, userLogout, type CurrentUser } from "@/lib/user-client";

/* -------------------------------------------------------------------------
   Popup de connexion / inscription internaute (style « étagère » bdebooks).
   - Onglets Se connecter / Créer un compte
   - Bouton « Continuer avec Google » (masqué si NEXT_PUBLIC_GOOGLE_CLIENT_ID absent)
   - Email + mot de passe en repli
   Monté une seule fois à la racine via <AuthProvider>. Les composants appellent
   useAuth().openAuth({...}) ; onSuccess se déclenche après connexion (ex. ajout
   du favori qui avait motivé l'ouverture).
------------------------------------------------------------------------- */

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type Mode = "signin" | "signup";

interface OpenOptions {
  /** Phrase de contexte sous le titre (ex. « …pour enregistrer ce livre »). */
  reason?: string;
  /** Mode d'ouverture par défaut. */
  mode?: Mode;
  /** Appelé après une connexion réussie. */
  onSuccess?: () => void;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loadingUser: boolean;
  openAuth: (opts?: OpenOptions) => void;
  closeAuth: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<OpenOptions>({});
  const successRef = useRef<(() => void) | undefined>(undefined);

  const refreshUser = useCallback(async () => {
    const u = await fetchCurrentUser();
    setUser(u);
    setLoadingUser(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const openAuth = useCallback((o: OpenOptions = {}) => {
    successRef.current = o.onSuccess;
    setOpts(o);
    setOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setOpen(false);
    successRef.current = undefined;
  }, []);

  const logout = useCallback(async () => {
    await userLogout();
    setUser(null);
    router.refresh();
  }, [router]);

  const handleSuccess = useCallback(async () => {
    await refreshUser();
    setOpen(false);
    const cb = successRef.current;
    successRef.current = undefined;
    router.refresh();
    if (cb) cb();
  }, [refreshUser, router]);

  return (
    <AuthContext.Provider
      value={{ user, loadingUser, openAuth, closeAuth, refreshUser, logout }}
    >
      {children}
      {open && (
        <AuthDialog
          reason={opts.reason}
          initialMode={opts.mode ?? "signin"}
          onClose={closeAuth}
          onSuccess={handleSuccess}
        />
      )}
    </AuthContext.Provider>
  );
}

/* -------------------------- Déclaration GIS (Google) -------------------- */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

let gisScriptPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Échec du chargement de Google"));
    document.head.appendChild(s);
  });
  return gisScriptPromise;
}

/* ------------------------------ Le dialogue ---------------------------- */
function AuthDialog({
  reason,
  initialMode,
  onClose,
  onSuccess,
}: {
  reason?: string;
  initialMode: Mode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBoxRef = useRef<HTMLDivElement>(null);

  // Fermer avec Échap + verrouiller le scroll de fond
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Bouton Google (si configuré)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !googleBoxRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (resp) => {
            setLoading(true);
            setError("");
            try {
              const r = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: resp.credential }),
              });
              if (r.ok) {
                onSuccess();
              } else {
                const d = await r.json().catch(() => ({}));
                setError(d.error || "La connexion Google a échoué.");
                setLoading(false);
              }
            } catch {
              setError("La connexion Google a échoué.");
              setLoading(false);
            }
          },
        });
        googleBoxRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBoxRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: 360,
        });
      })
      .catch(() => {
        /* script bloqué : on garde juste l'email */
      });
    return () => {
      cancelled = true;
    };
  }, [mode, onSuccess]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password || (mode === "signup" && !name)) {
      setError("Merci de remplir tous les champs.");
      setLoading(false);
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    try {
      const url = mode === "signin" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "signin" ? { email, password } : { name, email, password };
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        onSuccess();
      } else {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Une erreur est survenue.");
        setLoading(false);
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  };

  const title = mode === "signin" ? "Content de vous revoir" : "Créez votre compte";
  const defaultReason =
    mode === "signin"
      ? "Connectez-vous pour retrouver vos livres et vos favoris."
      : "Créez un compte gratuit pour garder vos livres et vos favoris.";

  return (
    <div
      className="ma auth-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          type="button"
          className="auth-close"
          aria-label="Fermer"
          onClick={onClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Onglets */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={`auth-tab ${mode === "signin" ? "is-active" : ""}`}
            onClick={() => { setMode("signin"); setError(""); }}
          >
            Se connecter
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`auth-tab ${mode === "signup" ? "is-active" : ""}`}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Créer un compte
          </button>
        </div>

        <h2 id="auth-title" className="auth-title">{title}</h2>
        <p className="auth-reason">{reason || defaultReason}</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="auth-google" ref={googleBoxRef} aria-busy={loading} />
            <p className="auth-legal">
              En continuant avec Google, vous acceptez nos{" "}
              <Link href="/conditions" target="_blank">conditions d&apos;utilisation</Link>{" "}
              et notre{" "}
              <Link href="/confidentialite" target="_blank">politique de confidentialité</Link>.
            </p>
            <div className="auth-sep"><span>ou avec votre email</span></div>
          </>
        )}

        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && (
            <label className="auth-field">
              <span>Nom</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                autoComplete="name"
                required
              />
            </label>
          )}
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="auth-field">
            <span>Mot de passe</span>
            <div className="auth-pw">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                className="auth-pw-toggle"
                aria-label={showPw ? "Masquer" : "Afficher"}
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? "Masquer" : "Afficher"}
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-primary btn-xl" disabled={loading}>
            {loading
              ? "Veuillez patienter…"
              : mode === "signin"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signin" ? (
            <>Pas encore de compte ?{" "}
              <button type="button" onClick={() => { setMode("signup"); setError(""); }}>
                Créer un compte
              </button>
            </>
          ) : (
            <>Déjà inscrit ?{" "}
              <button type="button" onClick={() => { setMode("signin"); setError(""); }}>
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
