import Icon, { I } from "@/components/design/icon";
import { formatAuthorName } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

/*
 * Encadré « Acheter ou écouter » de la fiche livre (liens d'affiliation).
 *
 * MASQUÉ tant qu'aucun identifiant n'est configuré : on peut déployer maintenant
 * et activer plus tard, sans toucher au code, en renseignant dans .env :
 *
 *   AMAZON_TAGS="fr:montag-21,com:montag-20,de:montag03-21"
 *       Identifiants Amazon Partenaires par boutique (amazon.fr, amazon.com…).
 *       La boutique suit la langue de la page ; sans tag pour elle → amazon.com.
 *   AUDIBLE_TRIAL_URL="https://…"
 *       Lien d'essai Audible fourni par le programme (affiché sur les fiches audio).
 *
 * puis `pm2 restart livrespdfgratuits --update-env`.
 * Les liens portent rel="sponsored" (exigence Google) et une mention d'affiliation.
 */

const STORE_BY_LOCALE: Partial<Record<Locale, string>> = {
  fr: "fr",
  en: "com",
  es: "es",
  de: "de",
  it: "it",
  nl: "nl",
  tr: "com.tr",
  ja: "co.jp",
};

function amazonTags(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (process.env.AMAZON_TAGS ?? "").split(",")) {
    const [store, tag] = part.split(":").map((s) => s?.trim());
    if (store && tag) out[store] = tag;
  }
  return out;
}

const TXT: Record<string, { title: string; paper: string; kindle: string; audible: string; disclosure: string }> = {
  fr: {
    title: "Version papier, Kindle ou audio",
    paper: "Acheter l'édition papier",
    kindle: "Voir la version Kindle",
    audible: "Écouter sur Audible (essai gratuit)",
    disclosure: "Liens partenaires : une petite commission nous aide à garder le site gratuit, sans surcoût pour vous.",
  },
  en: {
    title: "Paperback, Kindle or audiobook",
    paper: "Buy the paperback",
    kindle: "See the Kindle edition",
    audible: "Listen on Audible (free trial)",
    disclosure: "Affiliate links: a small commission helps keep this site free, at no extra cost to you.",
  },
  es: {
    title: "Papel, Kindle o audiolibro",
    paper: "Comprar la edición en papel",
    kindle: "Ver la edición Kindle",
    audible: "Escuchar en Audible (prueba gratis)",
    disclosure: "Enlaces de afiliado: una pequeña comisión nos ayuda a mantener el sitio gratuito, sin coste extra.",
  },
  de: {
    title: "Taschenbuch, Kindle oder Hörbuch",
    paper: "Taschenbuch kaufen",
    kindle: "Kindle-Ausgabe ansehen",
    audible: "Bei Audible hören (Gratis-Probe)",
    disclosure: "Partnerlinks: Eine kleine Provision hält diese Seite kostenlos – ohne Mehrkosten für Sie.",
  },
  it: {
    title: "Cartaceo, Kindle o audiolibro",
    paper: "Acquista l'edizione cartacea",
    kindle: "Vedi l'edizione Kindle",
    audible: "Ascolta su Audible (prova gratuita)",
    disclosure: "Link di affiliazione: una piccola commissione ci aiuta a mantenere il sito gratuito, senza costi aggiuntivi.",
  },
  pt: {
    title: "Papel, Kindle ou audiolivro",
    paper: "Comprar a edição em papel",
    kindle: "Ver a edição Kindle",
    audible: "Ouvir no Audible (teste grátis)",
    disclosure: "Links de afiliado: uma pequena comissão ajuda a manter o site gratuito, sem custo extra.",
  },
  ar: {
    title: "نسخة ورقية أو كيندل أو صوتية",
    paper: "شراء النسخة الورقية",
    kindle: "عرض نسخة كيندل",
    audible: "استمع على Audible (تجربة مجانية)",
    disclosure: "روابط تابعة: عمولة صغيرة تساعدنا على إبقاء الموقع مجانيًا دون أي تكلفة إضافية عليك.",
  },
};

interface BuyCardProps {
  locale: Locale;
  title: string;
  author: string;
  isbn?: string | null;
  hasAudio: boolean;
}

export default function BuyCard({ locale, title, author, isbn, hasAudio }: BuyCardProps) {
  const tags = amazonTags();
  const preferred = STORE_BY_LOCALE[locale] ?? "com";
  const store = tags[preferred] ? preferred : tags.com ? "com" : null;
  const audibleUrl = hasAudio ? process.env.AUDIBLE_TRIAL_URL?.trim() : "";
  if (!store && !audibleUrl) return null;

  const tx = TXT[locale] ?? TXT.en;
  // Titre principal sans sous-titre : meilleure recherche Amazon
  const main = title.split(/\s*[:;(\[]\s*/)[0].trim() || title;
  const query = isbn?.replace(/[^0-9Xx]/g, "") || `${main} ${formatAuthorName(author)}`.trim();
  const amazon = (index: string) =>
    store
      ? `https://www.amazon.${store}/s?k=${encodeURIComponent(query)}&i=${index}&tag=${encodeURIComponent(tags[store])}`
      : null;
  const paper = amazon("stripbooks");
  const kindle = amazon("digital-text");
  const rel = "sponsored nofollow noopener noreferrer";

  return (
    <div className="facts-card buy-card">
      <h2>{tx.title}</h2>
      {paper && (
        <a className="btn btn-outline btn-xl" href={paper} target="_blank" rel={rel}>
          <Icon d={I.book} /> {tx.paper}
        </a>
      )}
      {kindle && (
        <a className="btn btn-outline btn-xl" href={kindle} target="_blank" rel={rel}>
          <Icon d={I.external} /> {tx.kindle}
        </a>
      )}
      {audibleUrl && (
        <a className="btn btn-outline btn-xl" href={audibleUrl} target="_blank" rel={rel}>
          <Icon d={I.headphones} /> {tx.audible}
        </a>
      )}
      <p className="small-note">{tx.disclosure}</p>
    </div>
  );
}
