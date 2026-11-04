"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useI18n();

  const setLocale = (l: Locale) => {
    if (l === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded transition-colors",
            locale === l
              ? "bg-slate-800 text-white dark:bg-amber-500"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-amber-500"
          )}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
