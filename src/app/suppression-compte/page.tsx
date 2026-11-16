import DesignShell from "@/components/design/shell";
import FrenchOnlyNotice from "@/components/design/french-only";
import { frenchOnlyAlternates } from "@/i18n/seo";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata() {
  return {
    title: "Supprimer mon compte",
    description:
      "Comment supprimer votre compte Free PDF Books / Livres PDF Gratuits et les données associées, depuis l'application ou par e-mail.",
    alternates: frenchOnlyAlternates("/suppression-compte"),
  };
}

export default async function AccountDeletionPage() {
  const settings = await getSiteSettings();
  const email = settings.email || "contact@livrespdfgratuits.com";

  return (
    <DesignShell>
      <div className="wrap" style={{ maxWidth: 820, paddingTop: 16 }} lang="fr">
        <FrenchOnlyNotice />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Supprimer mon compte — Free PDF Books
        </h1>

        <div className="space-y-5 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            Le compte est facultatif : il sert à enregistrer vos favoris et à laisser des avis.
            Vous pouvez le supprimer à tout moment, définitivement.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white pt-2">
            Depuis l&apos;application Android
          </h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Ouvrez l&apos;application <strong>Free PDF Books</strong>.</li>
            <li>Allez dans l&apos;onglet <strong>Compte</strong> et connectez-vous.</li>
            <li>Touchez <strong>Supprimer mon compte</strong>, puis confirmez.</li>
          </ol>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white pt-2">
            Par e-mail (sans l&apos;application)
          </h2>
          <p>
            Écrivez-nous depuis l&apos;adresse e-mail de votre compte à{" "}
            <a href={`mailto:${email}?subject=Suppression%20de%20compte`} className="text-amber-600 hover:underline">
              {email}
            </a>{" "}
            avec l&apos;objet « Suppression de compte ». Nous supprimons le compte sous 30 jours.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white pt-2">
            Données supprimées et conservées
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Supprimées :</strong> votre nom, votre adresse e-mail, votre mot de passe (chiffré), vos favoris,
              les avis que vous avez publiés et votre accès au compte.
            </li>
            <li>
              <strong>Conservées :</strong> aucune donnée personnelle. Les statistiques de consultation des livres sont
              anonymes. Les livres téléchargés sur votre téléphone restent sur votre appareil.
            </li>
          </ul>
        </div>
      </div>
    </DesignShell>
  );
}
