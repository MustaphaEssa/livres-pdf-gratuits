import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Cookies de session (admin et utilisateur public sont cloisonnés)
export const ADMIN_SESSION_COOKIE = "admin_session";
export const USER_SESSION_COOKIE = "user_session";

// Durée de vie des sessions (secondes)
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 heures

// Audience du jeton : empêche qu'un jeton utilisateur serve de session admin
export type SessionAudience = "admin" | "user";

export interface SessionData extends JWTPayload {
  sub: string; // id
  email: string;
  name: string;
  role?: string; // uniquement pour les admins
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET manquant ou trop court. Définissez-le dans .env."
    );
  }
  return new TextEncoder().encode(secret);
}

// Signe un jeton de session pour une audience donnée (admin ou user)
export async function createSessionToken(
  payload: { id: string; email: string; name: string; role?: string },
  audience: SessionAudience
): Promise<string> {
  const claims: Record<string, unknown> = {
    email: payload.email,
    name: payload.name,
  };
  if (payload.role) claims.role = payload.role;

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

// Vérifie un jeton pour l'audience attendue. Renvoie null si invalide/mauvaise audience.
export async function verifySessionToken(
  token: string | undefined | null,
  audience: SessionAudience
): Promise<SessionData | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      audience,
    });
    return payload as SessionData;
  } catch {
    return null;
  }
}
