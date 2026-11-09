import Link from "next/link";
import BookCover, { type CoverBook } from "./book-cover";

export default function BookMini({ book }: { book: CoverBook }) {
  return (
    <Link href={`/livre/${book.slug}`} className="mini-row">
      <BookCover book={book} mini />
      <span className="t" dir="auto">
        {book.title}
      </span>
    </Link>
  );
}
