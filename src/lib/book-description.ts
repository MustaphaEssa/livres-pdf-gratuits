// Descriptions des fiches livre.
//
// Beaucoup de livres importés d'Internet Archive ont pour « description » des
// notes techniques sans intérêt pour le lecteur ni pour Google :
//   « Book digitized by Google and uploaded by ARLIMA (http://www.arlima.net) »
//   « Bound by Creuzevault. Original paper wrappers bound in. … »
// On les écarte et on génère à la place une description propre, dans la langue
// de la page, à partir des métadonnées (titre, auteur, genre, langue, année, formats).

import type { Locale } from "@/i18n/config";
import { fmt, intlLocale } from "@/i18n/format";
import { formatAuthorName } from "@/lib/utils";

// « victor hugo » → « Victor Hugo » (noms saisis tout en minuscules à l'import)
function displayAuthor(raw: string): string {
  const name = formatAuthorName(raw);
  if (name !== name.toLocaleLowerCase()) return name;
  return name
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toLocaleUpperCase())
    // particules en minuscules sauf en tête : « Jean de La Fontaine », « Ludwig van Beethoven »
    .replace(/(?<=\s)(De|Du|Des|Da|Di|Van|Von|Der|Den)(?=\s)/g, (p) => p.toLowerCase());
}

const JUNK = [
  /digiti[sz]ed\s+by/i,
  /uploaded\s+by/i,
  /scanned\s+(by|in|from)/i,
  /google\s+books?/i,
  /internet\s+archive/i,
  /digiti[sz]ation\s+(program|project)/i, // « From the Brittle Books digitization program… »
  /brittle\s+books/i,
  /archive\.org/i,
  /\barlima\b/i,
  /^\s*bound\s+by/i,
  /original\s+(paper\s+)?wrappers/i,
  /errata\s+slip/i,
  /\bt\.\s?p\./i, // « t.p. » (title page) : notice bibliographique
  /frontispiece|leaves\s+of\s+plates|microform|microfilm/i,
  /includes\s+(bibliographical|index)/i,
  /\b\d+\s?cm\b/i,
  /^\s*https?:\/\/\S+\s*$/i,
  /^\s*\[?\d{3,4}\]?\s*$/,
];

/** Vrai si la description est un vrai texte de présentation (pas une note technique). */
export function isUsefulDescription(desc: string | null | undefined): desc is string {
  const d = (desc ?? "").trim();
  if (d.length < 60) return false;
  return !JUNK.some((re) => re.test(d));
}

/** Coupe proprement un texte à ~max caractères (meta description). */
export function truncateText(s: string, max = 158): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[\s,;:.\-–]+\S*$/, "")}…`;
}

/** Nom d'une langue dans la langue de la page (« français », « English »…). */
function languageNameIn(locale: Locale, code: string | null | undefined): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: "language" }).of(code) ?? null;
  } catch {
    return null;
  }
}

interface DescBook {
  title: string;
  author: string;
  language?: string | null;
  publishedYear?: number | null;
  pageCount?: number | null;
  pdfUrl?: string | null;
  epubUrl?: string | null;
  hasAudio?: boolean;
}

interface DescMessages {
  book: { autoDesc: string; genre: string; language: string; publication: string; pages: string };
  common: { audio: string };
}

/**
 * Description générée : « « Titre » de Auteur. Livre du domaine public… (PDF, EPUB). »
 * suivie des détails « Genre : … · Langue : … · Publication : … ».
 */
export function autoDescription(
  t: DescMessages,
  locale: Locale,
  book: DescBook,
  genre?: string | null
): string {
  const formats = [book.pdfUrl && "PDF", book.epubUrl && "EPUB", book.hasAudio && t.common.audio]
    .filter(Boolean)
    .join(", ") || "PDF";
  const intro = fmt(t.book.autoDesc, { title: book.title, author: displayAuthor(book.author), formats });
  const sep = locale === "fr" ? " : " : ": ";
  const lang = languageNameIn(locale, book.language);
  const details = [
    genre && `${t.book.genre}${sep}${genre}`,
    lang && `${t.book.language}${sep}${lang}`,
    book.publishedYear && `${t.book.publication}${sep}${book.publishedYear}`,
    book.pageCount && book.pageCount > 0 && `${t.book.pages}${sep}${book.pageCount}`,
  ].filter(Boolean);
  return details.length ? `${intro} ${details.join(" · ")}.` : intro;
}
