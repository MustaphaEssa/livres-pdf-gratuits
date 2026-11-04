import "server-only";
import nodemailer from "nodemailer";

// Crée le transport SMTP depuis les variables d'environnement (ou null si non configuré)
function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL direct sur 465, STARTTLS sinon
    auth: { user, pass },
  });
}

export function isMailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Envoie un email. Renvoie false si SMTP non configuré (sans lever d'erreur).
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.warn(
      `[mailer] SMTP non configuré — email non envoyé : "${opts.subject}" -> ${opts.to}`
    );
    return false;
  }
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@localhost";
  await transport.sendMail({ from, ...opts });
  return true;
}
