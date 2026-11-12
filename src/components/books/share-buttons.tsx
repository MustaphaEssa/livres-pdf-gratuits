"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";

/**
 * Bouton de partage : menu natif du navigateur si disponible, sinon liste de
 * réseaux (Facebook, X, WhatsApp) + copie du lien.
 */
export function ShareButtons({
  url,
  title,
  className = "",
}: {
  url: string;
  title: string;
  className?: string;
}) {
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

  const networks = [
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, color: "#1877F2" },
    { name: "X", href: `https://twitter.com/intent/tweet?url=${enc}&text=${encT}`, color: "#000000" },
    { name: "WhatsApp", href: `https://wa.me/?text=${encT}%20${enc}`, color: "#25D366" },
  ];

  return (
    <div className={className} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-light btn-lg"
        onClick={nativeShare}
        aria-label="Partager"
        title="Partager"
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
                  <Check width={16} height={16} style={{ color: "var(--accent)" }} /> Lien copié !
                </>
              ) : (
                <>
                  <Link2 width={16} height={16} /> Copier le lien
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
