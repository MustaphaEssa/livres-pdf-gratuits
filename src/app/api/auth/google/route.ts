import { NextResponse } from "next/server";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { upsertGoogleUser } from "@/lib/user-server";
import {
  createSessionToken,
  USER_SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// JWKS public de Google (clés de signature des jetons ID). Mis en cache par jose.
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

const bodySchema = z.object({ credential: z.string().min(10) });

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Connexion Google non configurée." },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const rl = rateLimit(`google-login:${ip}`, 15, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Vérifie la signature + l'audience + l'émetteur du jeton ID Google
  let payload;
  try {
    const verified = await jwtVerify(parsed.data.credential, GOOGLE_JWKS, {
      audience: clientId,
      issuer: GOOGLE_ISSUERS,
    });
    payload = verified.payload as {
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
      given_name?: string;
      picture?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "Jeton Google invalide." },
      { status: 401 }
    );
  }

  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true";
  if (!payload.sub || !payload.email || !emailVerified) {
    return NextResponse.json(
      { error: "Compte Google non vérifié." },
      { status: 401 }
    );
  }

  const user = await upsertGoogleUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.given_name || "",
    image: payload.picture ?? null,
  });

  const token = await createSessionToken(user, "user");
  const response = NextResponse.json({
    ok: true,
    user: { email: user.email, name: user.name },
  });
  response.cookies.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
