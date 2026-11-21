"use client";

import { useState } from "react";
import Link from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import BookCard, { type CardBook } from "./book-card";
import Icon, { I } from "./icon";

export interface LangShelfTab {
  code: string; // code de langue ("fr", "es"…)
  label: string; // nom dans la langue (« Español »)
  books: CardBook[];
}

export default function LangShelf({
  newest,
  langs,
  initialTab = "new",
}: {
  newest: CardBook[];
  langs: LangShelfTab[];
  /** Onglet ouvert au chargement : la langue de la page si elle a des livres. */
  initialTab?: string;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<string>(() =>
    langs.some((l) => l.code === initialTab && l.books.length > 0) ? initialTab : "new"
  );
  const current = langs.find((l) => l.code === tab);
  const list = current ? current.books : newest;
  const href = current ? `/catalogue?language=${current.code}` : "/catalogue";

  // N'affiche que les langues qui ont des livres (en plus de « Nouveautés »)
  const tabs = [{ code: "new", label: t.home.newest }, ...langs.filter((l) => l.books.length > 0)];

  return (
    <section className="section wrap" aria-labelledby="shelf-title">
      <div className="section-head">
        <div>
          <div className="eyebrow">{t.home.shelfEyebrow}</div>
          <h2 id="shelf-title">{t.home.shelfTitle}</h2>
        </div>
        <div className="tabs" role="tablist" aria-label={t.nav.language}>
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
          {t.home.seeAllCatalogue} <Icon d={I.arrow} />
        </Link>
      </div>
    </section>
  );
}
