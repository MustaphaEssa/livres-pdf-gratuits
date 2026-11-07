"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

// Drapeau + nom natif pour chaque langue
const LOCALE_INFO: Record<Locale, { flag: string; label: string }> = {
  fr: { flag: "🇫🇷", label: "Français" },
  en: { flag: "🇬🇧", label: "English" },
};

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Ferme au clic extérieur et sur Échap
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const setLocale = (l: Locale) => {
    setOpen(false);
    if (l === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  const current = LOCALE_INFO[locale];

  return (
    <div ref={ref} className="relative">
      {/* Déclencheur */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
          "border-slate-200 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50/60",
          "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-amber-500/60 dark:hover:bg-slate-700/60",
          open && "border-amber-400 ring-2 ring-amber-400/30 dark:border-amber-500/60"
        )}
      >
        <Globe className="h-4 w-4 text-amber-500" />
        <span className="text-base leading-none">{current.flag}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Menu */}
      <div
        role="listbox"
        className={cn(
          "absolute right-0 z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-xl border shadow-xl transition-all duration-150",
          "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        {LOCALES.map((l) => {
          const info = LOCALE_INFO[l];
          const active = l === locale;
          return (
            <button
              key={l}
              role="option"
              aria-selected={active}
              onClick={() => setLocale(l)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                active
                  ? "bg-amber-50 font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
              )}
            >
              <span className="text-base leading-none">{info.flag}</span>
              <span className="flex-1 text-left">{info.label}</span>
              {active && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
