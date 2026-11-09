"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const PdfViewer = dynamic(
  () => import("@/components/books/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[100] flex items-center justify-center gap-2 bg-slate-950/95 text-slate-300 backdrop-blur-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        Ouverture du lecteur…
      </div>
    ),
  }
);

/**
 * Lecteur PDF en page dédiée (/livre/[slug]/lire).
 * - Ouvre à la page indiquée dans l'URL (#page=N), sinon à la dernière page lue.
 * - Met à jour l'URL (lien partageable) et mémorise la position (localStorage).
 * - Fermer revient à la fiche du livre.
 */
export function ReaderClient({
  pdfUrl,
  title,
  slug,
}: {
  pdfUrl: string;
  title: string;
  slug: string;
}) {
  const router = useRouter();
  const storageKey = `read:${slug}`;
  const [initialPage, setInitialPage] = useState<number | null>(null);

  // Détermine la page de départ : hash d'URL prioritaire, sinon reprise locale.
  useEffect(() => {
    let page = 1;
    const m = window.location.hash.match(/page=(\d+)/i);
    if (m) {
      page = parseInt(m[1], 10) || 1;
    } else {
      try {
        const saved = parseInt(localStorage.getItem(storageKey) || "", 10);
        if (Number.isFinite(saved) && saved > 0) page = saved;
      } catch {
        /* ignore */
      }
    }
    setInitialPage(page);
  }, [storageKey]);

  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPageChange = useCallback(
    (page: number) => {
      // Lien partageable sans empiler l'historique
      try {
        history.replaceState(null, "", `#page=${page}`);
      } catch {
        /* ignore */
      }
      if (saveRef.current) clearTimeout(saveRef.current);
      saveRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, String(page));
        } catch {
          /* ignore */
        }
      }, 400);
    },
    [storageKey]
  );

  const onClose = useCallback(() => {
    router.push(`/livre/${slug}`);
  }, [router, slug]);

  if (initialPage === null) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center gap-2 bg-slate-950/95 text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin" /> Ouverture du lecteur…
      </div>
    );
  }

  return (
    <PdfViewer
      pdfUrl={pdfUrl}
      title={title}
      initialPage={initialPage}
      onPageChange={onPageChange}
      onClose={onClose}
    />
  );
}
