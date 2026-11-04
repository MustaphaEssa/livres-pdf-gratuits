import "server-only";
import { cache } from "react";
import prisma from "@/lib/db";

// Forme des paramètres exposés au site public (valeurs non nulles garanties
// via des valeurs par défaut)
export interface PublicSettings {
  siteName: string;
  siteDescription: string;
  logo: string | null;
  email: string | null;
  telephone: string | null;
  address: string | null;
  googleAnalyticsId: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  featuredBooksCount: number;
}

const DEFAULTS: PublicSettings = {
  siteName: "Livre PDF Gratuit",
  siteDescription:
    "Téléchargez des milliers de livres PDF gratuits dans toutes les catégories : Romans, Sciences, Histoire, Informatique, Religion et bien plus encore.",
  logo: null,
  email: null,
  telephone: null,
  address: null,
  googleAnalyticsId: null,
  facebook: null,
  twitter: null,
  instagram: null,
  youtube: null,
  heroTitle: null,
  heroSubtitle: null,
  featuredBooksCount: 6,
};

// Récupère les paramètres du site, mis en cache sur la durée de la requête
// (plusieurs composants peuvent l'appeler sans multiplier les requêtes SQL).
// Ne lève jamais : renvoie les valeurs par défaut en cas d'absence ou d'erreur.
export const getSiteSettings = cache(async (): Promise<PublicSettings> => {
  try {
    const s = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (!s) return DEFAULTS;
    return {
      siteName: s.siteName || DEFAULTS.siteName,
      siteDescription: s.siteDescription || DEFAULTS.siteDescription,
      logo: s.logo,
      email: s.email,
      telephone: s.telephone,
      address: s.address,
      googleAnalyticsId: s.googleAnalyticsId,
      facebook: s.facebook,
      twitter: s.twitter,
      instagram: s.instagram,
      youtube: s.youtube,
      heroTitle: s.heroTitle,
      heroSubtitle: s.heroSubtitle,
      featuredBooksCount: s.featuredBooksCount || DEFAULTS.featuredBooksCount,
    };
  } catch {
    return DEFAULTS;
  }
});
