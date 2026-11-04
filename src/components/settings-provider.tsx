"use client";

import { createContext, useContext } from "react";
import type { PublicSettings } from "@/lib/settings";

const SettingsContext = createContext<PublicSettings | null>(null);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: PublicSettings;
  children: React.ReactNode;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

// Paramètres du site côté client (header, footer…). Renvoie null si le
// provider n'enveloppe pas l'arbre (les consommateurs gèrent le repli).
export function useSiteSettings(): PublicSettings | null {
  return useContext(SettingsContext);
}
