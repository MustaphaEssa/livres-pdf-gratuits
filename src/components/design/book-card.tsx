import Link from "next/link";
import { formatAuthorName } from "@/lib/utils";
import BookCover, { type CoverBook } from "./book-cover";

export interface CardBook extends CoverBook {
  mediaType?: string | null;
  audioTracks?: string | null;
  categories?: { category: { name: string; slug: string } }[];
}

/** Carte de liste : lien vers la fiche uniquement (pas de téléchargement direct). */
export default function BookCard({ book }: { book: CardBook }) {
  const href = `/livre/${book.slug}`;
  const hasTracks = !!book.audioTracks && book.audioTracks !== "[]";
  const isAudio = book.mediaType === "AUDIO" || hasTracks;
  const audioLabel = book.mediaType === "AUDIO" ? "Audio" : "PDF + audio";
  const cat = book.categories?.[0]?.category.name;
  return (
    <article className="book-card">
      <Link href={href} className="book-card-cover" aria-label={`${book.title} — voir la fiche`}>
        {isAudio && <span className="badge-audio">{audioLabel}</span>}
        <BookCover book={book} />
      </Link>
      <div className="book-card-text">
        <Link href={href} className="book-title" dir="auto">
          {book.title}
        </Link>
        <span className="book-author" dir="auto">
          {formatAuthorName(book.author)}
        </span>
        {cat && <span className="book-cat">{cat}</span>}
      </div>
    </article>
  );
}
