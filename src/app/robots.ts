import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { allPublicSegments } from "@/i18n/segments";

// PDF : volontairement NON bloqués. Ils renvoient un en-tête `Link: rel="canonical"`
// vers la fiche du livre ; Google doit pouvoir les explorer pour lire cet en-tête.
// La recherche interne (?q=) et les filtres sont en noindex,follow côté page ;
// on évite en plus d'y dépenser du budget de crawl.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/compte",
          "/auth",
          // Mêmes pages dans les autres langues (/en/account, /de/konto…)
          ...allPublicSegments("compte").map((s) => `/*/${s}`),
          "/*/auth",
          // Téléchargement forcé (compteur) : la fiche et /pdf suffisent
          ...allPublicSegments("telecharger").map((s) => `/*/${s}`),
          // Redirection aléatoire : aucune valeur pour l'index
          ...allPublicSegments("livre-au-hasard").flatMap((s) => [`/${s}`, `/*/${s}`]),
          // Recherche interne et combinaisons de filtres
          "/*?q=",
          "/*&q=",
          "/*?sort=",
          "/*&sort=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
