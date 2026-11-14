"use client";

import { useState } from "react";
import Link from "next/link";
import BookCard, { type CardBook } from "./book-card";
import Icon, { I } from "./icon";

export interface LangShelfTab {
  code: string; // code de langue ("fr", "es"…)
  label: string; // nom dans la langue (« Español »)
  books: CardBook[];
}

export default function LangShelf({ newest, langs }: { newest: CardBook[]; langs: LangShelfTab[] }) {
  const [tab, setTab] = useState<string>("new");
  const current = langs.find((l) => l.code === tab);
  const list = current ? current.books : newest;
  const href = current ? `/catalogue?language=${current.code}` : "/catalogue";

  // N'affiche que les langues qui ont des livres (en plus de « Nouveautés »)
  const tabs = [{ code: "new", label: "Nouveautés" }, ...langs.filter((l) => l.books.length > 0)];

  return (
    <section className="section wrap" aria-labelledby="shelf-title">
      <div className="section-head">
        <div>
          <div className="eyebrow">Sélection</div>
          <h2 id="shelf-title">Commencer par un classique</h2>
        </div>
        <div className="tabs" role="tablist" aria-label="Langue">
          {tabs.map((t) => (
            <button
              key={t.code}
              type="button"
              role="tab"
              className="tab"
              lang={t.code === "new" ? undefined : t.code}
              aria-selected={tab === t.code}
              onClick={() => setTab(t.code)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="shelf" role="tabpanel">
        {list.map((b) => (
          <BookCard key={b.slug} book={b} />
        ))}
      </div>
      <div className="shelf-cta">
        <Link href={href} className="btn btn-outline btn-lg">
          Voir tout le catalogue <Icon d={I.arrow} />
        </Link>
      </div>
    </section>
  );
}
