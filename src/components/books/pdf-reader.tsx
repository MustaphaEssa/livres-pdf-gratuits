"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// react-pdf est lourd : on ne le charge (côté client) qu'à l'ouverture.
const PdfViewer = dynamic(
  () => import("@/components/books/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-slate-500 py-16">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement de la visionneuse…
          </div>
        </CardContent>
      </Card>
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
    <Card>
      <CardContent className="p-6">
        <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">{ctaLabel}</p>
            <Button onClick={() => setOpen(true)} className="bg-amber-500 hover:bg-amber-600">
              <BookOpen className="mr-2 h-4 w-4" />
              {buttonLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
