"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// react-pdf est lourd : on ne le charge (côté client) qu'à l'ouverture.
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

interface PdfReaderProps {
  pdfUrl: string;
  title: string;
  ctaLabel?: string;
  buttonLabel?: string;
}

export function PdfReader({
  pdfUrl,
  title,
  ctaLabel = "Lisez ce livre directement dans votre navigateur",
  buttonLabel = "Lire en ligne",
}: PdfReaderProps) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <PdfViewer pdfUrl={pdfUrl} title={title} onClose={() => setOpen(false)} />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-white p-10 text-center dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15">
        <BookOpen className="h-7 w-7" />
      </div>
      <p className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
        {buttonLabel}
      </p>
      <p className="mx-auto mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {ctaLabel}
      </p>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 bg-amber-500 px-6 text-base hover:bg-amber-600"
      >
        <BookOpen className="mr-2 h-5 w-5" />
        {buttonLabel}
      </Button>
    </div>
  );
}
