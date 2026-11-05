import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
