import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getSiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Mentions légales",
  description: "Informations légales relatives à l'éditeur et à l'hébergeur du site.",
};

export default async function LegalNoticePage() {
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
            Mentions légales
          </h1>
          <p className="text-sm text-slate-500 mb-8">Dernière mise à jour : novembre 2026</p>

          <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Éditeur du site</h2>
              <p>
                Le site <strong>{site}</strong> ({host}) est édité par :
              </p>
              <ul className="list-none pl-0 mt-2 space-y-1">
                <li>Responsable de la publication : <strong>Mustapha Essaadaoui</strong></li>
                <li>Statut : <strong>Particulier</strong></li>
                <li>Contact : <a className="text-amber-600 hover:underline" href={`mailto:${email}`}>{email}</a></li>
                <li>Pays : Maroc</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Hébergement</h2>
              <p>
                Le site est hébergé sur un serveur dédié fourni par <strong>Hostinger</strong>{" "}
                (Hostinger International Ltd.), 61 Lordou Vironos Street, 6023 Larnaca, Chypre —{" "}
                <a className="text-amber-600 hover:underline" href="https://www.hostinger.com" target="_blank" rel="noopener noreferrer">hostinger.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Propriété intellectuelle</h2>
              <p>
                Les ouvrages proposés au téléchargement appartiennent au{" "}
                <strong>domaine public</strong> et sont issus de bibliothèques numériques
                ouvertes (notamment Internet Archive). La structure du site, son design et ses
                textes originaux sont la propriété de l&apos;éditeur. Toute reproduction non
                autorisée de ces éléments est interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Signalement d&apos;un contenu</h2>
              <p>
                Si vous estimez qu&apos;un ouvrage mis à disposition n&apos;est pas réellement dans
                le domaine public ou porte atteinte à vos droits, contactez-nous à{" "}
                <a className="text-amber-600 hover:underline" href={`mailto:${email}`}>{email}</a>.
                Le contenu concerné sera retiré dans les meilleurs délais après vérification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Responsabilité</h2>
              <p>
                {site} s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées mais ne
                saurait être tenu responsable des erreurs, d&apos;une indisponibilité du site ou de
                la présence de virus. L&apos;utilisation du site se fait sous la seule responsabilité
                de l&apos;utilisateur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Contact</h2>
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
