import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getSiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Conditions d'utilisation",
  description: "Les règles d'utilisation du site et de ses services.",
};

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const email = settings.email || "contact@livrespdfgratuits.com";
  const site = settings.siteName;
  const host = new URL(SITE_URL).hostname;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Conditions d&apos;utilisation
          </h1>
          <p className="text-sm text-slate-500 mb-8">Dernière mise à jour : novembre 2026</p>

          <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">1. Objet</h2>
              <p>
                Les présentes conditions régissent l&apos;utilisation du site {site} ({host}).
                En accédant au site, vous acceptez ces conditions dans leur intégralité.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">2. Service proposé</h2>
              <p>
                {site} met à disposition gratuitement des livres au format PDF appartenant au{" "}
                <strong>domaine public</strong>, à des fins de lecture et de téléchargement
                personnel. Le service est fourni « en l&apos;état », sans garantie de disponibilité
                permanente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">3. Utilisation du contenu</h2>
              <p>
                Les ouvrages étant dans le domaine public, vous pouvez les lire, les télécharger
                et les partager librement. Vous vous engagez toutefois à ne pas utiliser le site à
                des fins illégales ni à perturber son fonctionnement (téléchargements automatisés
                massifs, tentatives d&apos;intrusion, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">4. Compte utilisateur</h2>
              <p>
                La création d&apos;un compte est facultative. Vous êtes responsable de la
                confidentialité de vos identifiants et de l&apos;activité réalisée depuis votre
                compte. Vous pouvez demander la suppression de votre compte à tout moment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">5. Propriété intellectuelle</h2>
              <p>
                Les ouvrages relèvent du domaine public. En revanche, la charte graphique, les
                textes de présentation et l&apos;organisation du site sont protégés. Si vous pensez
                qu&apos;un contenu enfreint un droit d&apos;auteur, écrivez-nous à{" "}
                <a className="text-amber-600 hover:underline" href={`mailto:${email}`}>{email}</a>{" "}
                : il sera retiré après vérification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">6. Publicité et liens d&apos;affiliation</h2>
              <p>
                Le site peut afficher des annonces publicitaires et contenir des{" "}
                <strong>liens d&apos;affiliation</strong>. Cela signifie que si vous cliquez sur
                certains liens et effectuez un achat, nous pouvons percevoir une{" "}
                <strong>commission, sans aucun surcoût pour vous</strong>. Ces partenariats n&apos;influencent
                pas notre contenu. {site} n&apos;est pas responsable du contenu des sites tiers ni
                des transactions qui y sont effectuées.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">7. Limitation de responsabilité</h2>
              <p>
                {site} ne saurait être tenu responsable des dommages directs ou indirects liés à
                l&apos;utilisation du site, d&apos;une interruption de service ou de la présence
                éventuelle d&apos;erreurs dans les contenus.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">8. Modification des conditions</h2>
              <p>
                Ces conditions peuvent être modifiées à tout moment. La version en vigueur est
                celle publiée sur cette page. Nous vous invitons à la consulter régulièrement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">9. Contact</h2>
              <p>
                Pour toute question :{" "}
                <a className="text-amber-600 hover:underline" href={`mailto:${email}`}>{email}</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
