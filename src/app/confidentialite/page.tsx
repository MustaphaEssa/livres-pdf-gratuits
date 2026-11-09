import DesignShell from "@/components/design/shell";
import { getSiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Politique de confidentialité",
  description: "Comment nous collectons, utilisons et protégeons vos données personnelles.",
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const email = settings.email || "contact@livrespdfgratuits.com";
  const site = settings.siteName;
  const host = new URL(SITE_URL).hostname;

  return (
    <DesignShell>
      <div className="wrap">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-slate-500 mb-8">Dernière mise à jour : novembre 2026</p>

          <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">1. Introduction</h2>
              <p>
                La présente politique explique comment {site} ({host}) collecte, utilise et
                protège vos données personnelles lorsque vous utilisez notre site. En
                naviguant sur le site, vous acceptez les pratiques décrites ci-dessous.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">2. Données que nous collectons</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Compte</strong> : nom et adresse e-mail lors de l&apos;inscription.</li>
                <li><strong>Activité</strong> : livres téléchargés, favoris, avis déposés.</li>
                <li><strong>Formulaire de contact</strong> : les informations que vous nous transmettez.</li>
                <li><strong>Données techniques</strong> : adresse IP, type de navigateur, pages consultées (à des fins de sécurité et de statistiques).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">3. Utilisation des données</h2>
              <p>Nous utilisons vos données pour : gérer votre compte, fournir les téléchargements, répondre à vos messages, améliorer le site et assurer sa sécurité.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">4. Cookies</h2>
              <p>
                Le site utilise des cookies strictement nécessaires (session de connexion,
                préférence de langue) ainsi que des cookies de mesure d&apos;audience et de
                publicité (voir ci-dessous). Vous pouvez configurer votre navigateur pour
                refuser les cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">5. Publicité (Google AdSense)</h2>
              <p>
                Ce site peut diffuser des annonces via <strong>Google AdSense</strong>. Google,
                en tant que fournisseur tiers, utilise des cookies (notamment le cookie DART)
                pour diffuser des annonces en fonction de vos visites sur ce site et d&apos;autres
                sites. Vous pouvez désactiver la publicité personnalisée sur la page{" "}
                <a className="text-amber-600 hover:underline" href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Paramètres des annonces Google</a>{" "}
                ou via{" "}
                <a className="text-amber-600 hover:underline" href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
                Les fournisseurs tiers et réseaux publicitaires peuvent également diffuser des
                annonces sur ce site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">6. Mesure d&apos;audience</h2>
              <p>
                Nous pouvons utiliser Google Analytics pour comprendre l&apos;utilisation du site.
                Ces données sont agrégées et anonymisées autant que possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">7. Partage des données</h2>
              <p>
                Nous ne vendons pas vos données. Elles ne sont partagées qu&apos;avec des
                prestataires techniques nécessaires au fonctionnement du site (hébergement,
                publicité, mesure d&apos;audience) et dans le respect de la loi.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">8. Vos droits</h2>
              <p>
                Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos
                données. Pour l&apos;exercer, contactez-nous à{" "}
                <a className="text-amber-600 hover:underline" href={`mailto:${email}`}>{email}</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">9. Contact</h2>
              <p>
                Pour toute question relative à cette politique :{" "}
                <a className="text-amber-600 hover:underline" href={`mailto:${email}`}>{email}</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </DesignShell>
  );
}
