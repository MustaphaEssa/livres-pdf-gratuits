import type { Locale } from "./config";
import type { DeepPartial, PublicMessages } from "./messages/types";
import { adminFr, type AdminMessages } from "./messages/admin";
import { fr } from "./messages/fr";
import { en } from "./messages/en";
import { es } from "./messages/es";
import { ar } from "./messages/ar";
import { de } from "./messages/de";
import { it } from "./messages/it";
import { pt } from "./messages/pt";
import { nl } from "./messages/nl";
import { ru } from "./messages/ru";
import { tr } from "./messages/tr";
import { zh } from "./messages/zh";
import { ja } from "./messages/ja";

export type { Plural, PublicMessages } from "./messages/types";

/** Dictionnaire complet : interface publique traduite + admin (toujours en français). */
export type Messages = PublicMessages & { admin: AdminMessages };

const partial: Record<Exclude<Locale, "fr" | "en">, DeepPartial<PublicMessages>> = {
  es, ar, de, it, pt, nl, ru, tr, zh, ja,
};

// Fusion profonde : une clé absente d'une traduction retombe sur l'anglais.
function merge<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (!over) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b)
        ? merge(b, v as DeepPartial<typeof b>)
        : v ?? b;
  }
  return out as T;
}

const cache = new Map<Locale, Messages>();

export function getMessages(locale: Locale): Messages {
  let m = cache.get(locale);
  if (!m) {
    const pub = locale === "fr" ? fr : locale === "en" ? en : merge(en, partial[locale]);
    m = { ...pub, admin: adminFr };
    cache.set(locale, m);
  }
  return m;
}
