import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserCredentials } from "@/lib/user-server";
import { createSessionToken } from "@/lib/auth";
import { bad, MOBILE_TOKEN_MAX_AGE } from "@/lib/mobile";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const key = `mobile-login:${ip}`;
  const rl = rateLimit(key, 8, 10 * 60 * 1000);
  if (!rl.ok) return bad(`Trop de tentatives. Réessayez dans ${rl.retryAfter}s.`, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Requête invalide");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad("Email ou mot de passe invalide");

  const user = await verifyUserCredentials(parsed.data.email, parsed.data.password);
  if (!user) return bad("Email ou mot de passe incorrect", 401);

  resetRateLimit(key);
  const token = await createSessionToken(user, "user", MOBILE_TOKEN_MAX_AGE);
  return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}
