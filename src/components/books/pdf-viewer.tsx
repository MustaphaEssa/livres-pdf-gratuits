"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  TextCursor,
  X,
  BookOpen,
} from "lucide-react";

// Worker servi localement depuis /public (copié depuis pdfjs-dist)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// Options de chargement (stables — un nouvel objet relancerait le téléchargement)
const PDF_OPTIONS = {
  standardFontDataUrl: "/standard_fonts/",
  // Streaming + récupération incrémentale : la 1re page s'affiche sans
  // attendre le téléchargement complet (si le serveur gère les Range requests)
  disableStream: false,
  disableAutoFetch: false,
};

const MAX_WIDTH = 960; // largeur de rendu maximale (lecture confortable)

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

// Lecteur immersif plein écran : fond sombre, page centrée, barre de progression,
// saut de page, zoom, couche de texte optionnelle, navigation clavier/boutons.
export function PdfViewer({ pdfUrl, title, onClose, initialPage = 1, onPageChange }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(Math.max(1, initialPage));
  const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage)));
  const [zoom, setZoom] = useState(1); // 1 = ajusté à la largeur
  const [containerWidth, setContainerWidth] = useState(0);
  const [dpr, setDpr] = useState(1);
  const [showText, setShowText] = useState(false); // sélection de texte off par défaut
  const [error, setError] = useState<string | null>(null);

  // Mesure la largeur disponible (rendu net, adapté à l'écran)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    setDpr(Math.min(2, window.devicePixelRatio || 1));
    return () => ro.disconnect();
  }, []);

  // Verrouille le défilement de la page en arrière-plan pendant la lecture
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pageWidth = useMemo(() => {
    // marge horizontale (padding du conteneur) réservée
    const base = Math.min((containerWidth || MAX_WIDTH) - 32, MAX_WIDTH);
    return Math.max(200, Math.floor(base * zoom));
  }, [containerWidth, zoom]);

  const goTo = useCallback(
    (n: number) => {
      const clamped = Math.max(1, Math.min(numPages || n, n));
      setPageNumber(clamped);
      setPageInput(String(clamped));
      onPageChange?.(clamped);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [numPages, onPageChange]
  );

  const goPrev = useCallback(() => goTo(pageNumber - 1), [goTo, pageNumber]);
  const goNext = useCallback(() => goTo(pageNumber + 1), [goTo, pageNumber]);

  // Navigation clavier : flèches / espace pour tourner les pages, Échap pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === "INPUT") return; // ne pas intercepter la saisie
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  const progress = numPages > 0 ? (pageNumber / numPages) * 100 : 0;

  const pageLoader = (
    <div className="flex items-center gap-2 text-[#5d584f] py-24">
      <Loader2 className="h-5 w-5 animate-spin" />
      Chargement…
    </div>
  );

  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#1c1b19] transition-colors hover:bg-[#f1e9da] disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#faf6ef]">
      {/* Barre de progression */}
      <div className="h-1 w-full bg-[#e6dfd2]">
        <div
          className="h-full bg-[#2d3fa6] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Barre supérieure */}
      <header className="flex items-center justify-between gap-3 border-b border-[#e6dfd2] bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-[#1c1b19]">
          <BookOpen className="h-5 w-5 shrink-0 text-[#2d3fa6]" />
          <span className="truncate text-sm font-semibold" style={{ fontFamily: "var(--ma-serif)" }}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowText((v) => !v)}
            title="Sélection de texte (plus lent)"
            className={`${iconBtn} ${showText ? "bg-[#e8ebf8] text-[#2d3fa6]" : ""}`}
          >
            <TextCursor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((s) => Math.max(0.5, +(s - 0.2).toFixed(2)))}
            title="Dézoomer"
            className={iconBtn}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-11 text-center text-xs text-[#5d584f]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((s) => Math.min(3, +(s + 0.2).toFixed(2)))}
            title="Zoomer"
            className={iconBtn}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="mx-1 h-5 w-px bg-[#e6dfd2]" />
          <button type="button" onClick={onClose} title="Fermer (Échap)" className={iconBtn}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Zone de lecture */}
      <div
        ref={containerRef}
        className="flex flex-1 justify-center overflow-auto px-4 py-6"
      >
        {error ? (
          <div className="py-24 text-center text-[#5d584f]">
            <p className="mb-2">Impossible d&apos;afficher ce PDF.</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            options={PDF_OPTIONS}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setError(null);
            }}
            onLoadError={(e) => setError(e.message)}
            loading={pageLoader}
            className="h-max"
          >
            {containerWidth > 0 && (
              <Page
                key={`${pageNumber}-${pageWidth}-${showText}`}
                pageNumber={pageNumber}
                width={pageWidth}
                devicePixelRatio={dpr}
                renderTextLayer={showText}
                renderAnnotationLayer={showText}
                loading={pageLoader}
                className="overflow-hidden rounded-lg shadow-2xl shadow-black/50"
              />
            )}
          </Document>
        )}
      </div>

      {/* Barre inférieure : navigation */}
      <footer className="flex items-center justify-center gap-3 border-t border-[#e6dfd2] bg-white px-4 py-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={pageNumber <= 1}
          className={iconBtn}
          title="Page précédente (←)"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5 text-sm text-[#1c1b19]">
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => goTo(Number(pageInput) || pageNumber)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                goTo(Number(pageInput) || pageNumber);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="h-9 w-14 rounded-lg border border-[#e6dfd2] bg-white text-center text-[#1c1b19] outline-none focus:border-[#2d3fa6]"
            aria-label="Numéro de page"
          />
          <span className="text-[#5d584f]">/ {numPages || "…"}</span>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={numPages > 0 && pageNumber >= numPages}
          className={iconBtn}
          title="Page suivante (→)"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </footer>
    </div>
  );
}
