"use client";

import Link from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import { categoryLabel, fmt, authorLabel } from "@/i18n/format";
import BookCover, { type CoverBook } from "./book-cover";

export interface CardBook extends CoverBook {
  mediaType?: string | null;
  audioTracks?: string | null;
  categories?: { category: { name: string; slug: string } }[];
}

/** Carte de liste : lien vers la fiche uniquement (pas de téléchargement direct). */
export default function BookCard({ book }: { book: CardBook }) {
  const { t } = useI18n();
  const href = `/livre/${book.slug}`;
  const hasTracks = !!book.audioTracks && book.audioTracks !== "[]";
  const isAudio = book.mediaType === "AUDIO" || hasTracks;
  const audioLabel = book.mediaType === "AUDIO" ? t.common.audio : t.common.pdfAudio;
  const c0 = book.categories?.[0]?.category;
  const cat = c0 ? categoryLabel(t, c0) : null;
  return (
    <article className="book-card">
      <Link href={href} className="book-card-cover" aria-label={fmt(t.common.seeBookOf, { title: book.title })}>
        {isAudio && <span className="badge-audio">{audioLabel}</span>}
        <BookCover book={book} />
      </Link>
      <div className="book-card-text">
        <Link href={href} className="book-title" dir="auto">
          {book.title}
        </Link>
        <span className="book-author" dir="auto">
          {authorLabel(t, book.author)}
        </span>
        {cat && <span className="book-cat">{cat}</span>}
      </div>
    </article>
  );
}
