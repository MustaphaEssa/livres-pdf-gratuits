import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  verifySessionToken,
  type SessionData,
} from "@/lib/auth";

// Récupère la session admin courante depuis le cookie (server components / routes)
export async function getSession(): Promise<SessionData | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token, "admin");
}

export interface VerifiedAdmin {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Vérifie les identifiants admin contre la base (bcrypt). Renvoie null si invalide.
export async function verifyCredentials(
  email: string,
  password: string
): Promise<VerifiedAdmin | null> {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin || !admin.isActive) return null;

  const ok = await comparePassword(password, admin.password);
  if (!ok) return null;

  // Met à jour la date de dernière connexion (sans bloquer en cas d'erreur)
  await prisma.admin
    .update({ where: { id: admin.id }, data: { lastLogin: new Date() } })
    .catch(() => {});

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

// Compare un mot de passe clair à un hash. Tolère un éventuel mot de passe
// stocké en clair (anciennes données) pour éviter un verrouillage total.
async function comparePassword(plain: string, stored: string): Promise<boolean> {
  const looksHashed = /^\$2[aby]\$/.test(stored);
  if (looksHashed) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
