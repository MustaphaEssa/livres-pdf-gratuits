"use client";

import { useEffect, useRef, useState } from "react";
import { formatAuthorName } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { fmt } from "@/i18n/format";
import { RTL_LANGS } from "@/lib/languages";

// Couvertures « vides » : beaucoup de scans Internet Archive montrent la reliure
// (rectangle brun/noir uni) ou une page blanche. On les détecte sur une vignette
// 12×18 px et on affiche à la place la couverture typographique générée.
const coverVerdict = new Map<string, boolean>(); // src → couverture inutilisable ?

function isBlankCover(img: HTMLImageElement): boolean {
  try {
    const w = 12, h = 18;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const lum: number[] = [];
    for (let i = 0; i < d.length; i += 4) lum.push((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
    const mean = lum.reduce((a, b) => a + b, 0) / lum.length;
    const sd = Math.sqrt(lum.reduce((a, b) => a + (b - mean) ** 2, 0) / lum.length);
    // Calibré sur les couvertures du site : reliures noires/bordeaux/brunes
    // (luminosité < 0,45, peu de contraste) ou surface quasi unie. Les pages de
    // titre claires avec un peu de texte (écart-type ≥ 0,035) sont conservées.
    return (mean < 0.45 && sd < 0.09) || sd < 0.02;
  } catch {
    return false; // image d'un autre domaine (canvas « tainted ») : on la garde
  }
}

const PALETTE = [
  { bg: "#1f3a5f", fg: "#f4efe6" },
  { bg: "#b4532a", fg: "#fff7ee" },
  { bg: "#e9d8b4", fg: "#2a2118" },
  { bg: "#2f5d50", fg: "#f2f0e6" },
  { bg: "#1c1b19", fg: "#f1c27d" },
  { bg: "#7a1f2b", fg: "#f6e9dc" },
  { bg: "#c9d6e8", fg: "#1f2a44" },
];

function paletteIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

export interface CoverBook {
  slug: string;
  title: string;
  author: string;
  coverImage?: string | null;
  language?: string | null;
}

export default function BookCover({
  book,
  mini = false,
  className = "",
  priority = false,
}: {
  book: CoverBook;
  mini?: boolean;
  className?: string;
  /** Couverture visible dès l'ouverture (haut de page) : chargée tout de suite, en priorité. */
  priority?: boolean;
}) {
  const { t } = useI18n();
  const imgRef = useRef<HTMLImageElement>(null);
  const local = !!book.coverImage && book.coverImage.startsWith("/");
  const [blank, setBlank] = useState(() => (book.coverImage ? coverVerdict.get(book.coverImage) === true : false));

  // Analyse une fois l'image chargée (y compris si elle l'était déjà avant l'hydratation)
  useEffect(() => {
    const img = imgRef.current;
    const src = book.coverImage;
    if (!img || !src || !local || coverVerdict.has(src)) return;
    const check = () => {
      if (!img.naturalWidth) return;
      const v = isBlankCover(img);
      coverVerdict.set(src, v);
      if (v) setBlank(true);
    };
    if (img.complete) check();
    else img.addEventListener("load", check, { once: true });
    return () => img.removeEventListener("load", check);
  }, [book.coverImage, local]);

  const rtl = !!book.language && RTL_LANGS.has(book.language);
  const cls = `cover ${mini ? "cover-mini" : ""} ${rtl ? "is-rtl" : ""} ${className}`.trim();

  if (book.coverImage && !blank) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div className={cls}>
        <img
          ref={imgRef}
          src={book.coverImage}
          alt={fmt(t.common.coverOf, { title: book.title })}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
        />
      </div>
    );
  }

  const p = PALETTE[paletteIndex(book.slug || book.title)];
  return (
    <div
      className={cls}
      style={{ background: p.bg, color: p.fg }}
      role="img"
      aria-label={fmt(t.common.coverOfBy, { title: book.title, author: book.author })}
    >
      <div className="cover-spine" />
      {mini ? (
        <div className="cover-inner">
          <span className="cover-initial" dir="auto">
            {[...book.title][0]}
          </span>
        </div>
      ) : (
        <div className="cover-inner">
          <span className="cover-author" dir="auto">
            {formatAuthorName(book.author)}
          </span>
          <span className="cover-title" dir="auto">
            {book.title}
          </span>
          <span className="cover-foot">PDF</span>
        </div>
      )}
    </div>
  );
}
