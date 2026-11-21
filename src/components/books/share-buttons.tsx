"use client";

import { useI18n } from "@/components/i18n-provider";
import { useState, type MouseEvent } from "react";
import { Share2, Link2, Check } from "lucide-react";

/**
 * Partage : bouton Facebook direct (le réseau le plus utilisé par le public du site)
 * + bouton de partage général (menu natif du navigateur si disponible, sinon liste
 * de réseaux Facebook, X, WhatsApp et copie du lien).
 */
export function ShareButtons({
  url,
  title,
  className = "",
  size = "lg",
}: {
  url: string;
  title: string;
  className?: string;
  size?: "lg" | "sm";
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(title);

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* annulé → on ouvre le menu */
      }
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${enc}`;
  // Petite fenêtre de partage (reste sur la page) ; sinon le lien s'ouvre dans un onglet
  const shareFacebook = (e: MouseEvent) => {
    const w = 600;
    const h = 520;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);
    const win = window.open(fbHref, "fb-share", `width=${w},height=${h},left=${left},top=${top},noopener`);
    if (win) e.preventDefault();
  };
  const btnClass = size === "lg" ? "btn btn-light btn-lg" : "btn btn-light";

  const networks = [
    { name: "Facebook", href: fbHref, color: "#1877F2" },
    { name: "X", href: `https://twitter.com/intent/tweet?url=${enc}&text=${encT}`, color: "#000000" },
    { name: "WhatsApp", href: `https://wa.me/?text=${encT}%20${enc}`, color: "#25D366" },
  ];

  return (
    <div className={className} style={{ position: "relative", display: "inline-flex", gap: 8 }}>
      <a
        href={fbHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} fb-share`}
        onClick={shareFacebook}
        aria-label={`${t.common.share} : Facebook`}
        title={`${t.common.share} : Facebook`}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M14 8.5V6.6c0-.8.2-1.3 1.4-1.3H17V2.2c-.3 0-1.3-.2-2.4-.2-2.4 0-4 1.5-4 4.1v2.4H8v3.4h2.6V22H14V11.9h2.7l.4-3.4H14Z" />
        </svg>
      </a>
      <button
        type="button"
        className={btnClass}
        onClick={nativeShare}
        aria-label={t.common.share}
        title={t.common.share}
      >
        <Share2 width={20} height={20} />
      </button>

      {open && (
        <>
          {/* clic extérieur pour fermer */}
          <button
            type="button"
            aria-hidden
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 10, cursor: "default", background: "transparent", border: 0 }}
          />
          <div className="share-menu">
            {networks.map((n) => (
              <a
                key={n.name}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <span className="share-dot" style={{ backgroundColor: n.color }} />
                {n.name}
              </a>
            ))}
            <button type="button" onClick={copy}>
              {copied ? (
                <>
                  <Check width={16} height={16} style={{ color: "var(--accent)" }} /> {t.common.linkCopied}
                </>
              ) : (
                <>
                  <Link2 width={16} height={16} /> {t.common.copyLink}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
