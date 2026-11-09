"use client";

import { useState } from "react";
import Link from "next/link";
import BookCard, { type CardBook } from "./book-card";
import Icon, { I } from "./icon";

type Tab = "new" | "fr" | "en" | "ar";
const TABS: { id: Tab; label: string }[] = [
  { id: "new", label: "Nouveautés" },
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
];

export default function LangShelf({
  newest,
  byLang,
}: {
  newest: CardBook[];
  byLang: Record<"fr" | "en" | "ar", CardBook[]>;
}) {
  const [tab, setTab] = useState<Tab>("new");
  const list = tab === "new" ? newest : byLang[tab];
  const href = tab === "new" ? "/catalogue" : `/catalogue?language=${tab}`;

  // N'affiche que les onglets qui ont des livres (en plus de « Nouveautés »)
  const visibleTabs = TABS.filter((t) => t.id === "new" || (byLang[t.id] && byLang[t.id].length > 0));

  return (
    <section className="section wrap" aria-labelledby="shelf-title">
      <div className="section-head">
        <div>
          <div className="eyebrow">Sélection</div>
          <h2 id="shelf-title">Commencer par un classique</h2>
        </div>
        <div className="tabs" role="tablist" aria-label="Langue">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
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
