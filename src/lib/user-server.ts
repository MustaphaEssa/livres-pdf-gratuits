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

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return { id: user.id, name: user.name, email: user.email };
}
