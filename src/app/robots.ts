import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { allPublicSegments } from "@/i18n/segments";

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
          // Routes de téléchargement PDF, toutes langues (évite le gaspillage de crawl)
          ...allPublicSegments("telecharger").map((s) => `/*/${s}`),
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
