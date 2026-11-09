"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="w-full"
        onClick={nativeShare}
        aria-label="Partager"
        title="Partager"
      >
        <Share2 className="h-5 w-5" />
      </Button>

      {open && (
        <>
          {/* clic extérieur pour fermer */}
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-1">
            {networks.map((n) => (
              <a
                key={n.name}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: n.color }} />
                {n.name}
              </a>
            ))}
            <button
              type="button"
              onClick={copy}
              className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" /> Lien copié !
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" /> Copier le lien
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
