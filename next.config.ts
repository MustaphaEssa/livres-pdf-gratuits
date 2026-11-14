import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ne pas annoncer la techno du serveur (en-tête « x-powered-by: Next.js »)
  poweredByHeader: false,
  async headers() {
    return [
      {
        // HTTPS imposé au navigateur pendant 1 an (HSTS)
        source: "/:path*",
        headers: [{ key: "Strict-Transport-Security", value: "max-age=31536000" }],
      },
      {
        // Couvertures, photos, PDF importés : 7 jours en cache navigateur (au lieu de
        // max-age=0, qui forçait une revalidation à chaque visite). Un fichier
        // remplacé (réimport) reste servi au pire 7 jours dans son ancienne version.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Les couvertures/photos ne changent jamais → on cache les versions
    // optimisées 1 an (évite de re-optimiser à chaque visite, soulage le CPU VPS)
    minimumCacheTTL: 31536000,
  },
  // pdfjs-dist est requis au runtime (pour compter les pages PDF côté serveur)
  // au lieu d'être inclus dans le bundle serveur de Next.
  serverExternalPackages: ["pdfjs-dist"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
