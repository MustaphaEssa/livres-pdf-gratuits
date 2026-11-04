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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

const MAX_WIDTH = 1100; // largeur de rendu maximale en mode normal
const MAX_WIDTH_FULLSCREEN = 1600; // plafond plus large en plein écran

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

// Visionneuse PDF optimisée : rendu ajusté à la largeur, résolution plafonnée,
// couche de texte optionnelle, préchargement de la page suivante, nav clavier.
export function PdfViewer({ pdfUrl, title, onClose }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1); // 1 = ajusté à la largeur
  const [containerWidth, setContainerWidth] = useState(0);
  const [dpr, setDpr] = useState(1);
  const [showText, setShowText] = useState(false); // couche de texte (sélection) off par défaut
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mesure la largeur disponible (rendu net, adapté à l'écran)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Plafonne la densité de pixels à 2 (canvas plus légers sur écrans Retina)
    setDpr(Math.min(2, window.devicePixelRatio || 1));
    return () => ro.disconnect();
  }, []);

  const pageWidth = useMemo(() => {
    const cap = fullscreen ? MAX_WIDTH_FULLSCREEN : MAX_WIDTH;
    const base = Math.min(containerWidth || cap, cap);
    return Math.max(200, Math.floor(base * zoom));
  }, [containerWidth, zoom, fullscreen]);

  const goPrev = useCallback(
    () => setPageNumber((p) => Math.max(1, p - 1)),
    []
  );
  const goNext = useCallback(
    () => setPageNumber((p) => Math.min(numPages || p, p + 1)),
    [numPages]
  );

  // Navigation au clavier (flèches) + Échap pour quitter le plein écran
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, fullscreen]);

  // Bloque le défilement de la page en arrière-plan quand on est en plein écran
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const pageLoader = (
    <div className="flex items-center gap-2 text-slate-500 py-16">
      <Loader2 className="h-5 w-5 animate-spin" />
      Chargement…
    </div>
  );

  return (
    <Card className={fullscreen ? "fixed inset-0 z-[100] rounded-none border-0 overflow-auto" : undefined}>
      <CardContent className="p-4">
        {/* Barre d'outils */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={pageNumber <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-300 min-w-[90px] text-center">
              Page {pageNumber} / {numPages || "…"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={numPages > 0 && pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showText ? "default" : "outline"}
              size="sm"
              onClick={() => setShowText((v) => !v)}
              title="Activer la sélection de texte (plus lent)"
            >
              <TextCursor className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((s) => Math.max(0.5, +(s - 0.2).toFixed(2)))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-500 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((s) => Math.min(3, +(s + 0.2).toFixed(2)))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullscreen((v) => !v)}
              title={fullscreen ? "Quitter le plein écran (Échap)" : "Plein écran"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        {/* Zone de lecture */}
        <div
          ref={containerRef}
          className={`bg-slate-200 dark:bg-slate-900 rounded-lg overflow-auto flex justify-center p-4 ${
            fullscreen ? "h-[calc(100vh-7rem)]" : "max-h-[80vh]"
          }`}
        >
          {error ? (
            <div className="text-center py-16 text-slate-500">
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
                  className="shadow-lg"
                />
              )}
            </Document>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center mt-3">
          {title} · Utilisez ← → pour naviguer
        </p>
      </CardContent>
    </Card>
  );
}
