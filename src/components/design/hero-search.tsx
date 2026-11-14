"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon, { I } from "./icon";
import BookCover, { type CoverBook } from "./book-cover";
import { formatAuthorName } from "@/lib/utils";

const EXAMPLES = ["Victor Hugo", "Jules Verne", "Poésie", "Philosophie"];

/**
 * Recherche de l'accueil : sans JavaScript, le formulaire envoie vers /catalogue.
 * Avec JavaScript, des suggestions (couverture, auteur) s'affichent pendant la saisie
 * (combobox ARIA : flèches, Entrée, Échap).
 */
export default function HeroSearch() {
  const router = useRouter();
  const listId = useId();
  const [mode, setMode] = useState<"title" | "desc">("title");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CoverBook[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const term = q.trim();
  const suggest = mode === "title" && term.length >= 2;

  // Requête avec délai (200 ms) et annulation de la précédente
  useEffect(() => {
    if (!suggest) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggestions?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { books?: CoverBook[] };
        setResults(data.books ?? []);
        setActive(-1);
      } catch {
        /* requête annulée ou réseau : on garde l'état précédent */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term, suggest]);

  // Ferme la liste au clic à l'extérieur
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const showList = open && suggest && (results.length > 0 || !loading);
  const allHref = `/catalogue?q=${encodeURIComponent(term)}`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    const max = results.length; // index `max` = « voir tous les résultats »
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a >= max ? 0 : a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? max : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(active < max ? `/livre/${results[active].slug}` : allHref);
    }
  };

  return (
    <div className="search-stack">
      <div className="seg" role="tablist" aria-label="Mode de recherche">
        <button type="button" role="tab" aria-selected={mode === "title"} onClick={() => setMode("title")}>
          Titre ou auteur
        </button>
        <button type="button" role="tab" aria-selected={mode === "desc"} onClick={() => setMode("desc")}>
          Décrire un livre
        </button>
      </div>
      <div className="search-wrap" ref={boxRef}>
        <form className="search-box" action="/catalogue" role="search" onSubmit={() => setOpen(false)}>
          <Icon d={I.search} size={22} />
          <label className="sr-only" htmlFor="hero-q">
            Rechercher
          </label>
          <input
            id="hero-q"
            name="q"
            type="search"
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
            placeholder={
              mode === "title"
                ? "Titre, auteur, genre…"
                : "Ex. : un roman sur la vie des mineurs au XIXᵉ siècle"
            }
          />
          <button className="btn btn-primary" type="submit">
            Rechercher
          </button>
        </form>
        {showList && (
          <ul className="suggest" id={listId} role="listbox" aria-label="Suggestions">
            {results.length === 0 ? (
              <li className="suggest-empty" role="presentation">
                Aucun titre ni auteur pour « {term} ». Essayez le catalogue complet.
              </li>
            ) : (
              results.map((b, i) => (
                <li key={b.slug} role="presentation">
                  <Link
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    href={`/livre/${b.slug}`}
                    className="suggest-item"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setOpen(false)}
                  >
                    <BookCover book={b} mini />
                    <span className="suggest-text">
                      <span className="suggest-title" dir="auto">
                        {b.title}
                      </span>
                      <span className="suggest-author" dir="auto">
                        {formatAuthorName(b.author)}
                      </span>
                    </span>
                    {b.language && <span className="suggest-lang">{b.language.toUpperCase()}</span>}
                  </Link>
                </li>
              ))
            )}
            <li role="presentation">
              <Link
                id={`${listId}-${results.length}`}
                role="option"
                aria-selected={active === results.length}
                href={allHref}
                className="suggest-all"
                onMouseEnter={() => setActive(results.length)}
                onClick={() => setOpen(false)}
              >
                Tous les résultats pour « {term} » <Icon d={I.arrow} size={18} />
              </Link>
            </li>
          </ul>
        )}
      </div>
      <div className="chips">
        <span className="chips-label">Essayez :</span>
        {EXAMPLES.map((e) => (
          <Link key={e} className="chip" href={`/catalogue?q=${encodeURIComponent(e)}`}>
            {e}
          </Link>
        ))}
        <a className="chip chip-surprise" href="/livre-au-hasard" rel="nofollow">
          <Icon d={I.shuffle} size={17} /> Surprenez-moi
        </a>
      </div>
    </div>
  );
}
