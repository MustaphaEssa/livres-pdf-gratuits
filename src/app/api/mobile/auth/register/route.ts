import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/user-server";
import { createSessionToken } from "@/lib/auth";
import { bad, MOBILE_TOKEN_MAX_AGE } from "@/lib/mobile";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(100),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function POST(request: Request) {
  const rl = rateLimit(`mobile-register:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return bad(`Trop de tentatives. Réessayez dans ${rl.retryAfter}s.`, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Requête invalide");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Données invalides");

  const result = await registerUser(parsed.data);
  if (!result.ok) return bad(result.error, 409);

  const token = await createSessionToken(result.user, "user", MOBILE_TOKEN_MAX_AGE);
  return NextResponse.json(
    { token, user: { id: result.user.id, name: result.user.name, email: result.user.email } },
    { status: 201 }
  );
}
