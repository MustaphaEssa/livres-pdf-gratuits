import type { Locale } from "./config";

// Segments d'URL traduits par langue. Les routes internes (dossiers de src/app)
// restent en français ; le middleware traduit l'URL publique vers la route interne.
//   /en/book/les-miserables   → /livre/les-miserables
//   /de/katalog               → /catalogue
// Seuls les segments connus sont traduits (1er segment, sous-pages de /auth et de
// /livre/[slug]/…) : les slugs des livres, auteurs, catégories ne sont jamais touchés.
// Arabe, russe, chinois et japonais utilisent les segments anglais (URLs ASCII,
// lisibles et partageables sans encodage).

type Table = Record<string, string>;

const en: Table = {
  catalogue: "catalog", livre: "book", "livres-audio": "audiobooks", collections: "collections",
  auteurs: "authors", auteur: "author", categorie: "category", blog: "blog", "a-propos": "about",
  contact: "contact", compte: "account", auth: "auth", connexion: "login", inscription: "signup",
  "mot-de-passe-oublie": "forgot-password", reinitialiser: "reset-password", conditions: "terms",
  confidentialite: "privacy", "mentions-legales": "legal-notice", dmca: "dmca",
  "livre-au-hasard": "random-book", lire: "read", telecharger: "download",
};

const TABLES: Partial<Record<Locale, Table>> = {
  en,
  ar: en,
  ru: en,
  zh: en,
  ja: en,
  es: {
    catalogue: "catalogo", livre: "libro", "livres-audio": "audiolibros", collections: "colecciones",
    auteurs: "autores", auteur: "autor", categorie: "categoria", blog: "blog", "a-propos": "acerca-de",
    contact: "contacto", compte: "cuenta", auth: "auth", connexion: "iniciar-sesion", inscription: "registro",
    "mot-de-passe-oublie": "olvide-contrasena", reinitialiser: "restablecer-contrasena", conditions: "condiciones",
    confidentialite: "privacidad", "mentions-legales": "aviso-legal", dmca: "dmca",
    "livre-au-hasard": "libro-al-azar", lire: "leer", telecharger: "descargar",
  },
  de: {
    catalogue: "katalog", livre: "buch", "livres-audio": "hoerbuecher", collections: "sammlungen",
    auteurs: "autoren", auteur: "autor", categorie: "kategorie", blog: "blog", "a-propos": "ueber-uns",
    contact: "kontakt", compte: "konto", auth: "auth", connexion: "anmelden", inscription: "registrieren",
    "mot-de-passe-oublie": "passwort-vergessen", reinitialiser: "passwort-zuruecksetzen",
    conditions: "nutzungsbedingungen", confidentialite: "datenschutz", "mentions-legales": "impressum",
    dmca: "dmca", "livre-au-hasard": "zufallsbuch", lire: "lesen", telecharger: "herunterladen",
  },
  it: {
    catalogue: "catalogo", livre: "libro", "livres-audio": "audiolibri", collections: "raccolte",
    auteurs: "autori", auteur: "autore", categorie: "categoria", blog: "blog", "a-propos": "chi-siamo",
    contact: "contatti", compte: "account", auth: "auth", connexion: "accedi", inscription: "registrati",
    "mot-de-passe-oublie": "password-dimenticata", reinitialiser: "reimposta-password", conditions: "condizioni",
    confidentialite: "privacy", "mentions-legales": "note-legali", dmca: "dmca",
    "livre-au-hasard": "libro-a-caso", lire: "leggi", telecharger: "scarica",
  },
  pt: {
    catalogue: "catalogo", livre: "livro", "livres-audio": "audiolivros", collections: "colecoes",
    auteurs: "autores", auteur: "autor", categorie: "categoria", blog: "blog", "a-propos": "sobre",
    contact: "contacto", compte: "conta", auth: "auth", connexion: "entrar", inscription: "registo",
    "mot-de-passe-oublie": "esqueci-palavra-passe", reinitialiser: "repor-palavra-passe", conditions: "termos",
    confidentialite: "privacidade", "mentions-legales": "aviso-legal", dmca: "dmca",
    "livre-au-hasard": "livro-aleatorio", lire: "ler", telecharger: "descarregar",
  },
  nl: {
    catalogue: "catalogus", livre: "boek", "livres-audio": "luisterboeken", collections: "collecties",
    auteurs: "auteurs", auteur: "auteur", categorie: "categorie", blog: "blog", "a-propos": "over-ons",
    contact: "contact", compte: "account", auth: "auth", connexion: "inloggen", inscription: "registreren",
    "mot-de-passe-oublie": "wachtwoord-vergeten", reinitialiser: "wachtwoord-herstellen", conditions: "voorwaarden",
    confidentialite: "privacy", "mentions-legales": "juridisch", dmca: "dmca",
    "livre-au-hasard": "willekeurig-boek", lire: "lezen", telecharger: "downloaden",
  },
  tr: {
    catalogue: "katalog", livre: "kitap", "livres-audio": "sesli-kitaplar", collections: "koleksiyonlar",
    auteurs: "yazarlar", auteur: "yazar", categorie: "kategori", blog: "blog", "a-propos": "hakkimizda",
    contact: "iletisim", compte: "hesap", auth: "auth", connexion: "giris", inscription: "kayit",
    "mot-de-passe-oublie": "sifremi-unuttum", reinitialiser: "sifre-sifirla", conditions: "kullanim-kosullari",
    confidentialite: "gizlilik", "mentions-legales": "yasal-bilgiler", dmca: "dmca",
    "livre-au-hasard": "rastgele-kitap", lire: "oku", telecharger: "indir",
  },
};

const REVERSE = new Map<Locale, Table>();
function reverse(locale: Locale): Table {
  let r = REVERSE.get(locale);
  if (!r) {
    r = Object.fromEntries(Object.entries(TABLES[locale] ?? {}).map(([k, v]) => [v, k]));
    REVERSE.set(locale, r);
  }
  return r;
}

// Positions traduites : segment 0 toujours ; segment 1 sous /auth ; segment 2 sous /livre/[slug]
function translatable(internal: string[], i: number): boolean {
  if (i === 0) return true;
  if (i === 1) return internal[0] === "auth";
  if (i === 2) return internal[0] === "livre";
  return false;
}

/** Chemin interne (français, sans préfixe) → segments publics de la langue. */
export function toPublicSegments(locale: Locale, internalPath: string): string {
  const table = TABLES[locale];
  if (!table) return internalPath;
  const segs = internalPath.split("/").slice(1);
  return "/" + segs.map((s, i) => (translatable(segs, i) && table[s] ? table[s] : s)).join("/");
}

/** Segments publics de la langue → chemin interne (français). Les segments déjà internes sont acceptés. */
export function toInternalSegments(locale: Locale, publicPath: string): string {
  const rev = reverse(locale);
  const segs = publicPath.split("/").slice(1);
  const out: string[] = [];
  segs.forEach((s, i) => {
    const mapped = rev[s];
    // On décide de la position avec les segments déjà convertis (out)
    out.push(mapped && translatable([...out, mapped], i) ? mapped : s);
  });
  return "/" + out.join("/");
}

/** Tous les segments publics d'un segment interne (robots.txt). */
export function allPublicSegments(internal: string): string[] {
  const set = new Set([internal]);
  for (const t of Object.values(TABLES)) if (t?.[internal]) set.add(t[internal]);
  return [...set];
}
