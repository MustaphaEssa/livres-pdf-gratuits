"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Document, Page, Outline, Thumbnail, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  TextCursor,
  X,
  BookOpen,
  PanelLeft,
  Download,
  Maximize2,
  Minimize2,
  Columns2,
  Square,
  List,
  Images,
} from "lucide-react";

// Worker servi localement depuis /public (copié depuis pdfjs-dist)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const PDF_OPTIONS = {
  standardFontDataUrl: "/standard_fonts/",
  disableStream: false,
  disableAutoFetch: false,
};

const MAX_WIDTH = 920; // largeur max d'UNE page (lecture confortable)

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

// Miniature chargée seulement quand elle entre dans la vue (perf sur gros PDF).
function LazyThumb({
  pageNumber,
  active,
  onClick,
}: {
  pageNumber: number;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { root: el.closest("[data-thumb-scroll]"), rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={`group flex w-full flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
        active ? "bg-[#e8ebf8]" : "hover:bg-[#f1e9da]"
      }`}
    >
      <div
        className={`overflow-hidden rounded border bg-white ${
          active ? "border-[#2d3fa6] ring-1 ring-[#2d3fa6]" : "border-[#e6dfd2]"
        }`}
        style={{ width: 112, minHeight: 150 }}
      >
        {seen ? (
          <Thumbnail pageNumber={pageNumber} width={112} />
        ) : (
          <div className="flex h-[150px] w-[112px] items-center justify-center text-[#c9bfae]">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      <span className={`text-xs ${active ? "font-semibold text-[#2d3fa6]" : "text-[#5d584f]"}`}>
        {pageNumber}
      </span>
    </button>
  );
}

// Lecteur PDF immersif : barre latérale (miniatures + sommaire), vue simple ou
// double-page, zoom/ajustement, slider de progression, plein écran, téléchargement.
export function PdfViewer({ pdfUrl, title, onClose, initialPage = 1, onPageChange }: PdfViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(Math.max(1, initialPage));
  const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage)));
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<"width" | "page">("width");
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [dpr, setDpr] = useState(1);
  const [showText, setShowText] = useState(false);
  const [spread, setSpread] = useState(false); // double-page
  const [sidebar, setSidebar] = useState(false);
  const [tab, setTab] = useState<"pages" | "outline">("pages");
  const [hasOutline, setHasOutline] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réglages au montage (indépendants du chargement du PDF)
  useEffect(() => {
    setDpr(Math.min(2, window.devicePixelRatio || 1));
    setSpread(window.innerWidth >= 1100);
    const onResize = () => {
      if (window.innerWidth < 1100) setSpread(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Mesure la zone de lecture via ref de rappel : react-pdf masque ses enfants
  // tant que le PDF n'est pas chargé, donc l'élément n'apparaît qu'ensuite.
  const roRef = useRef<ResizeObserver | null>(null);
  const setAreaNode = useCallback((el: HTMLDivElement | null) => {
    areaRef.current = el;
    roRef.current?.disconnect();
    if (!el) return;
    const update = () => setArea({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    roRef.current = ro;
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  const cols = spread ? 2 : 1;
  // Largeur de rendu d'UNE page selon le mode d'ajustement + zoom
  const pageWidth = useMemo(() => {
    const gutter = cols === 2 ? 24 : 0;
    const avail = (area.w || MAX_WIDTH) - 48 - gutter;
    const base =
      fitMode === "width"
        ? Math.min(avail / cols, MAX_WIDTH)
        : // fit-page : largeur déduite d'une hauteur dispo et d'un ratio A4 (~1.414)
          Math.min(((area.h || 800) - 48) / 1.414, avail / cols, MAX_WIDTH);
    return Math.max(180, Math.floor(base * zoom));
  }, [area, cols, fitMode, zoom]);

  const goTo = useCallback(
    (n: number) => {
      const clamped = Math.max(1, Math.min(numPages || n, n));
      setPageNumber(clamped);
      setPageInput(String(clamped));
      onPageChange?.(clamped);
      areaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [numPages, onPageChange]
  );
  const step = cols;
  const goPrev = useCallback(() => goTo(pageNumber - step), [goTo, pageNumber, step]);
  const goNext = useCallback(() => goTo(pageNumber + step), [goTo, pageNumber, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const rightPage = spread && pageNumber + 1 <= numPages ? pageNumber + 1 : null;
  const progress = numPages > 0 ? (pageNumber / numPages) * 100 : 0;

  const pageLoader = (
    <div className="flex items-center gap-2 py-24 text-[#5d584f]">
      <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
    </div>
  );
  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#1c1b19] transition-colors hover:bg-[#f1e9da] disabled:opacity-30 disabled:hover:bg-transparent";
  const activeBtn = "bg-[#e8ebf8] text-[#2d3fa6]";

  const pageProps = {
    width: pageWidth,
    devicePixelRatio: dpr,
    renderTextLayer: showText,
    renderAnnotationLayer: showText,
    loading: pageLoader,
    className: "overflow-hidden rounded-md bg-white shadow-xl shadow-black/20",
  } as const;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] flex flex-col bg-[#faf6ef]">
      {/* Progression (fine, en haut) */}
      <div className="h-1 w-full bg-[#e6dfd2]">
        <div
          className="h-full bg-[#2d3fa6] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Barre supérieure */}
      <header className="flex items-center gap-2 border-b border-[#e6dfd2] bg-white px-3 py-2">
        <button
          type="button"
          onClick={() => setSidebar((v) => !v)}
          title="Miniatures / sommaire"
          className={`${iconBtn} ${sidebar ? activeBtn : ""}`}
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <div className="mr-1 flex min-w-0 items-center gap-2 text-[#1c1b19]">
          <BookOpen className="hidden h-5 w-5 shrink-0 text-[#2d3fa6] sm:block" />
          <span className="truncate text-sm font-semibold" style={{ fontFamily: "var(--ma-serif)" }}>
            {title}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Saut de page */}
          <div className="mr-1 hidden items-center gap-1 text-sm text-[#1c1b19] sm:flex">
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
              className="h-8 w-12 rounded-lg border border-[#e6dfd2] bg-white text-center outline-none focus:border-[#2d3fa6]"
              aria-label="Numéro de page"
            />
            <span className="text-[#5d584f]">/ {numPages || "…"}</span>
          </div>

          <button
            type="button"
            onClick={() => setFitMode((m) => (m === "width" ? "page" : "width"))}
            title={fitMode === "width" ? "Ajuster à la page" : "Ajuster à la largeur"}
            className={iconBtn}
          >
            <span className="text-[11px] font-semibold">
              {fitMode === "width" ? "↔" : "⤢"}
            </span>
          </button>
          <button type="button" onClick={() => setZoom((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))} title="Dézoomer" className={iconBtn}>
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-xs text-[#5d584f]">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((s) => Math.min(3, +(s + 0.15).toFixed(2)))} title="Zoomer" className={iconBtn}>
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="mx-1 hidden h-5 w-px bg-[#e6dfd2] md:block" />
          <button
            type="button"
            onClick={() => setSpread((v) => !v)}
            title={spread ? "Page simple" : "Double page"}
            className={`${iconBtn} hidden md:inline-flex ${spread ? activeBtn : ""}`}
          >
            {spread ? <Square className="h-4 w-4" /> : <Columns2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setShowText((v) => !v)}
            title="Sélection de texte"
            className={`${iconBtn} hidden md:inline-flex ${showText ? activeBtn : ""}`}
          >
            <TextCursor className="h-4 w-4" />
          </button>
          <button type="button" onClick={toggleFullscreen} title="Plein écran" className={iconBtn}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <a
            href={pdfUrl}
            download
            title="Télécharger le PDF"
            className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2d3fa6] px-3 text-sm font-semibold text-white hover:bg-[#25348a]"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </a>
          <button type="button" onClick={onClose} title="Fermer (Échap)" className={iconBtn}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <Document
        file={pdfUrl}
        options={PDF_OPTIONS}
        onLoadSuccess={(pdf) => {
          setNumPages(pdf.numPages);
          setError(null);
          pdf.getOutline?.().then((o) => setHasOutline(!!o && o.length > 0)).catch(() => {});
        }}
        onLoadError={(e) => setError(e.message)}
        loading={<div className="flex flex-1 items-center justify-center">{pageLoader}</div>}
        error={
          <div className="flex flex-1 items-center justify-center py-24 text-center text-[#5d584f]">
            Impossible d&apos;afficher ce PDF.
          </div>
        }
        className="flex min-h-0 flex-1"
      >
        {/* Barre latérale : miniatures / sommaire */}
        {sidebar && (
          <aside className="flex w-[180px] shrink-0 flex-col border-r border-[#e6dfd2] bg-white">
            <div className="flex border-b border-[#e6dfd2] text-sm">
              <button
                type="button"
                onClick={() => setTab("pages")}
                className={`flex flex-1 items-center justify-center gap-1 py-2 ${
                  tab === "pages" ? "border-b-2 border-[#2d3fa6] font-semibold text-[#2d3fa6]" : "text-[#5d584f]"
                }`}
              >
                <Images className="h-4 w-4" /> Pages
              </button>
              <button
                type="button"
                onClick={() => setTab("outline")}
                className={`flex flex-1 items-center justify-center gap-1 py-2 ${
                  tab === "outline" ? "border-b-2 border-[#2d3fa6] font-semibold text-[#2d3fa6]" : "text-[#5d584f]"
                }`}
              >
                <List className="h-4 w-4" /> Sommaire
              </button>
            </div>
            <div data-thumb-scroll className="min-h-0 flex-1 overflow-y-auto p-2">
              {tab === "pages" ? (
                numPages > 0 ? (
                  <div className="space-y-1">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
                      <LazyThumb
                        key={n}
                        pageNumber={n}
                        active={n === pageNumber || n === rightPage}
                        onClick={() => goTo(n)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4">{pageLoader}</div>
                )
              ) : hasOutline ? (
                <div className="pdf-outline text-sm text-[#1c1b19]">
                  <Outline
                    onItemClick={({ pageNumber: p }) => p && goTo(p)}
                  />
                </div>
              ) : (
                <p className="p-3 text-sm text-[#5d584f]">Pas de sommaire dans ce PDF.</p>
              )}
            </div>
          </aside>
        )}

        {/* Zone de lecture */}
        <div ref={setAreaNode} className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-6">
          {error ? (
            <div className="py-24 text-center text-[#5d584f]">
              <p className="mb-2">Impossible d&apos;afficher ce PDF.</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : area.w > 0 ? (
            <div className="flex items-start gap-6">
              <Page key={`l-${pageNumber}-${pageWidth}-${showText}`} pageNumber={pageNumber} {...pageProps} />
              {rightPage && (
                <Page key={`r-${rightPage}-${pageWidth}-${showText}`} pageNumber={rightPage} {...pageProps} />
              )}
            </div>
          ) : (
            pageLoader
          )}
        </div>
      </Document>

      {/* Barre inférieure : navigation + slider de progression */}
      <footer className="flex items-center gap-3 border-t border-[#e6dfd2] bg-white px-4 py-2.5">
        <button type="button" onClick={goPrev} disabled={pageNumber <= 1} className={iconBtn} title="Précédent (←)">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="shrink-0 text-sm tabular-nums text-[#1c1b19]">
          {rightPage ? `${pageNumber}–${rightPage}` : pageNumber} / {numPages || "…"}
        </span>
        <input
          type="range"
          min={1}
          max={Math.max(1, numPages)}
          value={pageNumber}
          onChange={(e) => goTo(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#e6dfd2] accent-[#2d3fa6]"
          aria-label="Progression"
        />
        <span className="w-10 shrink-0 text-right text-sm tabular-nums text-[#5d584f]">
          {Math.round(progress)}%
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={numPages > 0 && pageNumber >= numPages}
          className={iconBtn}
          title="Suivant (→)"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </footer>
    </div>
  );
}
