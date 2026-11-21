"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

/*
 * Petit encart « Ce livre vous a plu ? ★★★★★ » qui glisse en bas de l'écran juste
 * après un clic sur un lien de téléchargement (élément marqué data-rate-trigger).
 *
 * - Non bloquant : pas de fond sombre, la page reste utilisable (pas d'interstitiel).
 * - Une note en un clic (publiée tout de suite) ; le commentaire reste facultatif,
 *   via le formulaire d'avis de la fiche (#reviews), modéré dans l'admin.
 * - Ne réapparaît pas : livre déjà noté (localStorage) ou encart fermé (session).
 */
const DELAY_MS = 1500;
const ratedKey = (bookId: string) => `rated:${bookId}`;
const DISMISS_KEY = "rate-prompt-dismissed";

function storageGet(store: "local" | "session", key: string): string | null {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}
function storageSet(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    /* navigation privée : on ignore */
  }
}

export function RatePrompt({ bookId }: { bookId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-rate-trigger]");
      if (!el) return;
      if (storageGet("local", ratedKey(bookId)) || storageGet("session", DISMISS_KEY)) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpen(true), DELAY_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [bookId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dismiss = () => {
    storageSet("session", DISMISS_KEY, "1");
    setOpen(false);
  };

  const rate = async (rating: number) => {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, rating, website: "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 429) throw new Error(data.error || "error");
      storageSet("local", ratedKey(bookId), String(rating));
      setStatus("done");
      // Affiche la nouvelle note dans la liste d'avis de la fiche
      window.dispatchEvent(new CustomEvent("reviews:refresh"));
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error && e.message !== "error" ? e.message : t.auth.genericError);
    }
  };

  const addComment = () => {
    setOpen(false);
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!open) return null;

  return (
    <div className="rate-prompt" role="dialog" aria-modal="false" aria-labelledby="rate-prompt-title">
      <button type="button" className="rate-prompt-close" onClick={dismiss} aria-label={t.reviews.close}>
        ×
      </button>
      {status === "done" ? (
        <>
          <p id="rate-prompt-title" className="rate-prompt-title">
            {t.reviews.promptThanks}
          </p>
          <button type="button" className="btn btn-light" onClick={addComment}>
            {t.reviews.promptAddComment}
          </button>
        </>
      ) : (
        <>
          <p id="rate-prompt-title" className="rate-prompt-title">
            {t.reviews.promptTitle}
          </p>
          <p className="rate-prompt-hint">{t.reviews.promptHint}</p>
          <div className="stars-input" role="radiogroup" aria-label={t.reviews.chooseRating}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={false}
                aria-label={`${s}/5`}
                className={s <= hover ? "on" : ""}
                disabled={status === "sending"}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onFocus={() => setHover(s)}
                onBlur={() => setHover(0)}
                onClick={() => rate(s)}
              >
                <svg width={30} height={30} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2.8l2.8 5.7 6.3.9-4.5 4.4 1 6.3L12 17.1l-5.6 3 1-6.3L2.9 9.4l6.3-.9L12 2.8Z"
                    fill={s <= hover ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
          {status === "error" && <p className="form-note err">{error}</p>}
        </>
      )}
    </div>
  );
}
