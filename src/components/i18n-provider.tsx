"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/i18n/config";
import { getMessages, type Messages } from "@/i18n/messages";

interface I18nValue {
  locale: Locale;
  t: Messages;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // Les messages sont statiques et petits : on les résout côté client aussi
  const value: I18nValue = { locale, t: getMessages(locale) };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Repli sécurisé (ne devrait pas arriver si le provider enveloppe l'app)
    return { locale: "fr", t: getMessages("fr") };
  }
  return ctx;
}
