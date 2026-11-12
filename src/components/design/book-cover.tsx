import { formatAuthorName } from "@/lib/utils";

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
}: {
  book: CoverBook;
  mini?: boolean;
  className?: string;
}) {
  const rtl = book.language === "ar";
  const cls = `cover ${mini ? "cover-mini" : ""} ${rtl ? "is-rtl" : ""} ${className}`.trim();

  if (book.coverImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <div className={cls}>
        <img
          src={book.coverImage}
          alt={`Couverture de ${book.title}`}
          loading="lazy"
          decoding="async"
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
      aria-label={`Couverture de ${book.title}, ${book.author}`}
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
