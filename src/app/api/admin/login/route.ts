import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCredentials } from "@/lib/auth-server";
import {
  createSessionToken,
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function POST(request: Request) {
  // Anti-bruteforce : 5 tentatives / 10 min par IP
  const ip = clientIp(request);
  const rl = rateLimit(`admin-login:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email ou mot de passe invalide" },
      { status: 400 }
    );
  }

  const admin = await verifyCredentials(
    parsed.data.email,
    parsed.data.password
  );

  // Message générique pour ne pas révéler si l'email existe
  if (!admin) {
    return NextResponse.json(
      { error: "Email ou mot de passe incorrect" },
      { status: 401 }
    );
  }

  // Connexion réussie : on remet le compteur à zéro
  resetRateLimit(`admin-login:${ip}`);

  const token = await createSessionToken(admin, "admin");

  const response = NextResponse.json({
    ok: true,
    admin: { email: admin.email, name: admin.name, role: admin.role },
  });

  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
