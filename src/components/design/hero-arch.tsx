"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import { fmt } from "@/i18n/format";
import BookCover, { type CoverBook } from "./book-cover";
import Icon, { I } from "./icon";
import { formatAuthorName } from "@/lib/utils";

export interface ArchBook extends CoverBook {
  hasPdf: boolean;
}

const ROTATE_MS = 5500;

/**
 * Arche « livre du jour » : les couvertures tournent toutes les 5,5 s (pause au survol,
 * au focus et si l'utilisateur préfère moins d'animations). Cliquer une couverture latérale
 * l'amène devant ; le panneau donne l'accès direct : lire en ligne, PDF, fiche.
 */
export default function HeroArch({ books }: { books: ArchBook[] }) {
  const { t } = useI18n();
  const n = books.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (paused || reduced || n < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, reduced, n]);

  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n]);

  if (n === 0) return null;
  const book = books[active];

  // Position de chaque couverture par rapport à la couverture active
  const slot = (i: number) => {
    const d = (i - active + n) % n;
    if (d === 0) return "is-front";
    if (d === 1) return "is-right";
    if (d === n - 1) return "is-left";
    return "is-hidden";
  };

  return (
    <div
      className="arch-carousel"
      role="region"
      aria-roledescription={t.arch.roledesc}
      aria-label={t.arch.label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-stage">
        <div className="arch" />
        <div className="arch-inner" />
        {books.map((b, i) => {
          const pos = slot(i);
          return pos === "is-front" ? (
            <Link
              key={b.slug}
              href={`/livre/${b.slug}`}
              className={`arch-cover ${pos}`}
              aria-label={fmt(t.common.seeBookOf, { title: b.title })}
            >
              <BookCover book={b} priority={i === active} />
            </Link>
          ) : (
            <button
              key={b.slug}
              type="button"
              className={`arch-cover ${pos}`}
              onClick={() => go(i)}
              tabIndex={pos === "is-hidden" ? -1 : 0}
              aria-hidden={pos === "is-hidden" ? true : undefined}
              aria-label={fmt(t.arch.show, { title: b.title })}
            >
              <BookCover book={b} />
            </button>
          );
        })}
      </div>

      <div className="arch-panel" aria-live="polite">
        <span className="arch-panel-cover" aria-hidden="true">
          <BookCover book={book} mini />
        </span>
        <div className="arch-panel-text">
          <span className="arch-kicker">{t.arch.kicker} · {active + 1}/{n}</span>
          <Link href={`/livre/${book.slug}`} className="arch-title" dir="auto">
            {book.title}
          </Link>
          <span className="arch-author" dir="auto">
            {formatAuthorName(book.author)}
          </span>
        </div>
        <div className="arch-actions">
          {book.hasPdf ? (
            <>
              <Link className="btn btn-gold" href={`/livre/${book.slug}/lire`}>
                <Icon d={I.book} size={18} /> {t.arch.read}
              </Link>
              <a className="btn btn-ghost-light" href={`/livre/${book.slug}/telecharger`}>
                <Icon d={I.download} size={18} /> PDF
              </a>
            </>
          ) : (
            <Link className="btn btn-gold" href={`/livre/${book.slug}`}>
              {t.common.seeBook} <Icon d={I.arrow} size={18} />
            </Link>
          )}
        </div>
        {n > 1 && (
          <div className="arch-nav">
            <button type="button" className="arch-step" onClick={() => go(active - 1)} aria-label={t.arch.prevBook}>
              <Icon d={I.chevL} size={18} />
            </button>
            <div className="arch-dots">
              {books.map((b, i) => (
                <button
                  key={b.slug}
                  type="button"
                  className="arch-dot"
                  aria-label={fmt(t.arch.bookN, { n: i + 1, title: b.title })}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => go(i)}
                >
                  {i === active && !paused && !reduced && (
                    <span className="arch-dot-fill" style={{ animationDuration: `${ROTATE_MS}ms` }} key={active} />
                  )}
                </button>
              ))}
            </div>
            <button type="button" className="arch-step" onClick={() => go(active + 1)} aria-label={t.arch.nextBook}>
              <Icon d={I.chevR} size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
