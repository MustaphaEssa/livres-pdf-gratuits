"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { LOCALES, LOCALE_COOKIE, LOCALE_INFO, localizePath, stripLocale, type Locale } from "@/i18n/config";
import { BLOG_LOCALES } from "@/i18n/seo";
import Icon, { I } from "./icon";

/**
 * Sélecteur de langue de l'interface. Change le préfixe d'URL (/en/…, /ar/…) et
 * recharge la page : la langue pilote <html lang/dir>, posé par le layout racine.
 */
export default function LangSwitcher({ variant = "icon" }: { variant?: "icon" | "list" }) {
  const { locale, t } = useI18n();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hrefFor = (l: Locale) => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return localizePath(l, stripLocale(pathname)) + search;
  };

  const go = (l: Locale) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    // Mémorise le choix : prioritaire sur la langue du navigateur (voir middleware)
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    if (l !== locale) window.location.assign(hrefFor(l));
  };

  // Blog : seules les langues qui ont des articles (les autres redirigent vers l'anglais)
  const available: readonly Locale[] = /^\/blog(\/|$)/.test(stripLocale(pathname))
    ? LOCALES.filter((l) => BLOG_LOCALES.includes(l))
    : LOCALES;

  const items = available.map((l) => (
    <a
      key={l}
      href={localizePath(l, stripLocale(pathname))}
      hrefLang={l}
      lang={l}
      className="lang-item"
      aria-current={l === locale ? "true" : undefined}
      onClick={go(l)}
    >
      {LOCALE_INFO[l].label}
    </a>
  ));

  if (variant === "list") {
    return (
      <div className="lang-list" role="group" aria-label={t.nav.language}>
        {items}
      </div>
    );
  }

  return (
    <div className="lang-switch" ref={ref}>
      <button
        type="button"
        className="icon-btn lang-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t.nav.language} : ${LOCALE_INFO[locale].label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon d={I.globe} />
        <span className="lang-code">{locale.toUpperCase()}</span>
      </button>
      {open && <div className="lang-menu">{items}</div>}
    </div>
  );
}
