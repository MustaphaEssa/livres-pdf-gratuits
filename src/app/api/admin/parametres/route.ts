import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { SETTINGS_DEFAULTS } from "@/lib/settings";

export const runtime = "nodejs";

const DEFAULT_ID = "default";

// Champs texte modifiables de SiteSettings
const TEXT_FIELDS = [
  "siteName",
  "siteDescription",
  "logo",
  "favicon",
  "email",
  "telephone",
  "address",
  "googleAnalyticsId",
  "facebook",
  "twitter",
  "instagram",
  "youtube",
  "heroTitle",
  "heroSubtitle",
] as const;

// Récupère les paramètres du site (crée l'enregistrement par défaut au besoin)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID },
    update: {},
  });

  // Pré-remplit les champs vides avec les valeurs par défaut réellement
  // utilisées par le site public (sinon l'admin affiche des champs vides
  // alors que le site montre un email, une description, etc.)
  const merged: Record<string, unknown> = { ...settings };
  for (const [key, value] of Object.entries(SETTINGS_DEFAULTS)) {
    if ((merged[key] === null || merged[key] === "") && value !== null) {
      merged[key] = value;
    }
  }
  return NextResponse.json({ settings: merged });
}

// Met à jour les paramètres du site
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const data: Record<string, string | number | null> = {};
  for (const field of TEXT_FIELDS) {
    if (field in body) {
      const value = body[field];
      data[field] = typeof value === "string" && value.trim() ? value.trim() : null;
    }
  }
  if (typeof body.featuredBooksCount === "number") {
    data.featuredBooksCount = Math.max(0, Math.min(24, Math.floor(body.featuredBooksCount)));
  }

  // siteName ne doit pas être vidé (valeur par défaut requise)
  if (data.siteName === null) delete data.siteName;

  const settings = await prisma.siteSettings.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, ...data },
    update: data,
  });
  return NextResponse.json({ ok: true, settings });
}
