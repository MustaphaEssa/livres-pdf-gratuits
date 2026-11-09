"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Préfixes de routes où Google Analytics ne doit PAS se charger
// (back-office et espaces privés : évite de polluer les statistiques).
const EXCLUDED_PREFIXES = ["/admin"];

/**
 * Charge Google Analytics, sauf sur les pages d'administration.
 * Rendu côté client pour pouvoir lire le chemin courant.
 */
export function Analytics({ gaId }: { gaId?: string | null }) {
  const pathname = usePathname();

  if (!gaId) return null;
  if (EXCLUDED_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
