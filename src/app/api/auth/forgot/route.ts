import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  // Réponse générique dans tous les cas (ne révèle pas l'existence du compte)
  const generic = NextResponse.json({ ok: true });
  if (!parsed.success) return generic;

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return generic;

  // Jeton valable 1 heure
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const origin =
    process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const link = `${origin}/auth/reinitialiser?token=${token}`;

  await sendMail({
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <p>Bonjour ${user.name},</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe sur Livre PDF Gratuit.</p>
      <p><a href="${link}">Cliquez ici pour choisir un nouveau mot de passe</a> (lien valable 1 heure).</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  }).catch((e) => console.error("[forgot] envoi email échoué:", e));

  return generic;
}
