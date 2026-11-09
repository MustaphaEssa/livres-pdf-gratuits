"use client";

import { useState } from "react";
import Link from "next/link";
import Icon, { I } from "./icon";

const EXAMPLES = ["Victor Hugo", "Jules Verne", "Poésie", "Philosophie"];

export default function HeroSearch() {
  const [mode, setMode] = useState<"title" | "desc">("title");
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
      <form className="search-box" action="/catalogue" role="search">
        <Icon d={I.search} size={22} />
        <label className="sr-only" htmlFor="hero-q">
          Rechercher
        </label>
        <input
          id="hero-q"
          name="q"
          type="search"
          autoComplete="off"
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
      <div className="chips">
        <span className="chips-label">Essayez :</span>
        {EXAMPLES.map((e) => (
          <Link key={e} className="chip" href={`/catalogue?q=${encodeURIComponent(e)}`}>
            {e}
          </Link>
        ))}
      </div>
    </div>
  );
}
