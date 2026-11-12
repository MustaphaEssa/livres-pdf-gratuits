import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import {
  USER_SESSION_COOKIE,
  verifySessionToken,
  type SessionData,
} from "@/lib/auth";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

// Session utilisateur courante depuis le cookie
export async function getUserSession(): Promise<SessionData | null> {
  const token = (await cookies()).get(USER_SESSION_COOKIE)?.value;
  return verifySessionToken(token, "user");
}

export type RegisterResult =
  | { ok: true; user: PublicUser }
  | { ok: false; error: string };

// Crée un compte utilisateur (mot de passe hashé bcrypt, email unique)
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Un compte existe déjà avec cet email" };
  }

  const hashed = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.name.trim(), email, password: hashed },
  });

  return {
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  };
}

// Vérifie les identifiants utilisateur. Renvoie null si invalides.
export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user || !user.isActive) return null;
  // Compte créé via Google uniquement : pas de mot de passe local.
  if (!user.password) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return { id: user.id, name: user.name, email: user.email };
}

// Connecte (ou crée) un utilisateur à partir d'un profil Google vérifié.
// Lie par googleId, sinon par email (compte email existant), sinon crée.
export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  image?: string | null;
}): Promise<PublicUser> {
  const email = profile.email.toLowerCase().trim();
  const name = profile.name.trim() || email.split("@")[0];

  const byGoogle = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (byGoogle) {
    return { id: byGoogle.id, name: byGoogle.name, email: byGoogle.email };
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    const updated = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: profile.googleId,
        image: byEmail.image ?? profile.image ?? null,
      },
    });
    return { id: updated.id, name: updated.name, email: updated.email };
  }

  const created = await prisma.user.create({
    data: { name, email, googleId: profile.googleId, image: profile.image ?? null },
  });
  return { id: created.id, name: created.name, email: created.email };
}
