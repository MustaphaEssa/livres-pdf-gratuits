import DesignShell from "@/components/design/shell";
import { getSiteSettings } from "@/lib/settings";

export const metadata = {
  title: "Politique DMCA / Droits d'auteur",
  description:
    "Notre politique de signalement et de retrait (DMCA). Comment signaler un contenu qui porterait atteinte à des droits d'auteur sur livrespdfgratuits.com.",
  alternates: { canonical: "/dmca" },
};

export default async function DmcaPage() {
  const settings = await getSiteSettings();
  const email = settings.email || "contact@livrespdfgratuits.com";

  return (
    <DesignShell>
      <div className="wrap" style={{ maxWidth: 820, paddingTop: 16 }}>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Politique relative aux droits d&apos;auteur (DMCA)
          </h1>

          <div className="space-y-5 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              {settings.siteName} met à disposition des livres relevant du{" "}
              <strong>domaine public</strong>, provenant de bibliothèques
              numériques publiques (notamment Internet Archive). Nous respectons
              les droits de propriété intellectuelle et nous attendons de nos
              utilisateurs qu&apos;ils en fassent autant.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-white pt-2">
              Vous êtes titulaire de droits ?
            </h2>
            <p>
              Si vous estimez qu&apos;une œuvre disponible sur ce site porte
              atteinte à vos droits d&apos;auteur, vous pouvez nous demander son
              retrait. Nous traitons chaque demande sérieuse et retirons
              rapidement tout contenu qui ne serait pas libre de droits.
            </p>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-white pt-2">
              Comment nous signaler un contenu
            </h2>
            <p>
              Envoyez-nous une demande à l&apos;adresse{" "}
              <a href={`mailto:${email}`} className="text-amber-600 hover:underline">
                {email}
              </a>{" "}
              en précisant :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Le titre du livre et le lien (URL) de la page concernée ;</li>
              <li>
                La preuve que vous êtes le titulaire des droits ou son
                représentant autorisé ;
              </li>
              <li>
                Vos coordonnées (nom, email) pour que nous puissions vous
                répondre ;
              </li>
              <li>
                Une déclaration de bonne foi indiquant que l&apos;usage
                contesté n&apos;est pas autorisé.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-white pt-2">
              Notre engagement
            </h2>
            <p>
              Dès réception d&apos;une demande valable, nous retirons ou
              bloquons l&apos;accès au contenu concerné dans les meilleurs
              délais, généralement sous 48 à 72 heures. Un bouton{" "}
              <strong>« Signaler ce livre »</strong> est également présent sur
              chaque fiche pour nous alerter en un clic.
            </p>

            <p className="text-sm text-slate-500 pt-4">
              Cette page décrit notre procédure de signalement inspirée du{" "}
              <em>Digital Millennium Copyright Act</em> (DMCA). Elle ne constitue
              pas un conseil juridique.
            </p>
          </div>
        </div>
    </DesignShell>
  );
}
