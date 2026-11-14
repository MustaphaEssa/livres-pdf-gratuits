import "server-only";
import { headers } from "next/headers";
import { normalizeLocale, LOCALE_HEADER, type Locale } from "./config";
import { getMessages, type Messages } from "./messages";

/** Langue de la requête, déduite du préfixe d'URL par le middleware. */
export async function getLocale(): Promise<Locale> {
  return normalizeLocale((await headers()).get(LOCALE_HEADER));
}

export async function getServerI18n(): Promise<{ locale: Locale; t: Messages }> {
  const locale = await getLocale();
  return { locale, t: getMessages(locale) };
}
