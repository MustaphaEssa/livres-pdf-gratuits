import "server-only";
import prisma from "@/lib/db";
import { matchKey, titleKey, authorKey } from "@/lib/text-key";

/**
 * Détection des doublons pour la page admin « Doublons ».
 *
 * Plus large que la clé exacte de Nettoyage/Fusion : on nettoie d'abord les
 * titres importés « sales » avant de les comparer, par exemple
 *   « Honoré De Balzac - Honorine (1843) (FR) »  →  « honorine »
 * Deux niveaux :
 *  - IDENTIQUES : même auteur, même langue, même format, même titre nettoyé.
 *    Un exemplaire est recommandé, les autres sont proposés à la suppression.
 *  - SIMILAIRES : même auteur, titres très proches ou l'un contenu dans l'autre
 *    (recueils, éditions avec sous-titre…). Rien n'est coché : à vérifier à la main.
 */

// Contenu entre parenthèses/crochets considéré comme du bruit d'import :
// année, plage d'années, code langue, mention de site, format de fichier.
function isNoiseTag(content: string): boolean {
  const c = content.trim();
  if (!c) return true;
  if (/^\d{3,4}(\s*-\s*\d{0,4})?$/.test(c)) return true; // (1843), (1802-1885)
  if (/^[a-z]{2,3}$/i.test(c) && !/^[ivxlc]+$/i.test(c)) return true; // (FR), (eng) — pas (II)
  if (/www|https?:|\.(com|org|net|app|fr|io)\b|\b(pdf|epub|ebook|e-book)\b/i.test(c)) return true;
  return false;
}

function stripNoise(title: string): string {
  return title
    .replace(/\(([^()]*)\)|\[([^[\]]*)\]/g, (m, a, b) => (isNoiseTag(a ?? b ?? "") ? " " : m))
    .replace(/\.(pdf|epub)$/i, " ");
}

// Variantes d'écriture du nom d'auteur au début d'un titre
function authorVariants(author: string): string[] {
  const a = authorKey(author);
  const raw = matchKey(author);
  const parts = a.split(" ").filter(Boolean);
  const set = new Set<string>([a, raw, parts.slice().reverse().join(" ")]);
  if (parts.length > 1) set.add(parts[parts.length - 1]);
  return [...set].filter((v) => v.length >= 3).sort((x, y) => y.length - x.length);
}

/** Titre nettoyé servant à comparer deux livres d'un même auteur. */
export function cleanTitleKey(title: string, author: string): string {
  let t = titleKey(stripNoise(title), author);
  // « Honore de Balzac Honorine » → « honorine »
  for (const v of authorVariants(author)) {
    if (t.startsWith(v + " ") && t.length > v.length + 1) {
      t = t.slice(v.length + 1).trim();
      break;
    }
  }
  return t;
}

const STOPWORDS = new Set(
  (
    "les des une dans par pour sur avec sans aux est son ses leur leurs que qui " +
    "the and for with from into its his her their tome vol volume livre book " +
    "del los las por con der die das und von een het"
  ).split(" ")
);

function significantWords(key: string): Set<string> {
  return new Set(key.split(" ").filter((w) => w.length >= 3 && !STOPWORDS.has(w)));
}

// Deux titres (déjà nettoyés, auteur identique) désignent-ils probablement la
// même œuvre ou un recueil qui la contient ?
function isSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const ws = significantWords(short);
  const wl = significantWords(long);
  if (!ws.size || !wl.size) return false;
  // Tomes différents d'une même série (« … v 1 » / « … v 10 ») : pas des doublons
  const isNum = (w: string) => /^\d+$/.test(w) || (w.length <= 4 && /^[ivxlc]+$/.test(w));
  const words = (k: string) => k.split(" ").filter((w) => !isNum(w)).join(" ");
  const nums = (k: string) => k.split(" ").filter(isNum).join(" ");
  if (words(a) === words(b) && nums(a) !== nums(b)) return false;
  // Le titre court apparaît tel quel dans le long (« honorine » ⊂ « le colonel chabert honorine … »)
  if (short.length >= 4 && ` ${long} `.includes(` ${short} `)) return true;
  let inter = 0;
  for (const w of ws) if (wl.has(w)) inter++;
  const union = ws.size + wl.size - inter;
  return inter >= 2 && inter / union >= 0.6;
}

const SELECT = {
  id: true,
  slug: true,
  title: true,
  author: true,
  language: true,
  mediaType: true,
  pageCount: true,
  pdfSize: true,
  epubUrl: true,
  coverImage: true,
  publishedYear: true,
  publisher: true,
  sourceId: true,
  downloadCount: true,
  viewCount: true,
  isPublished: true,
  isFeatured: true,
  createdAt: true,
  _count: { select: { favorites: true, reviews: true, collections: true } },
} as const;

export interface DupBook {
  id: string;
  slug: string;
  title: string;
  language: string;
  mediaType: string;
  pageCount: number | null;
  pdfSize: number | null;
  hasEpub: boolean;
  coverImage: string | null;
  publishedYear: number | null;
  publisher: string | null;
  imported: boolean;
  downloadCount: number;
  viewCount: number;
  favorites: number;
  reviews: number;
  collections: number;
  isPublished: boolean;
  isFeatured: boolean;
  /** Identifiant du sous-groupe « identiques » (même titre nettoyé/langue/format) */
  exactKey: string;
  /** Exemplaire recommandé dans son sous-groupe d'identiques */
  isKeeper: boolean;
  /** Copie certaine d'un autre livre du groupe (proposée à la suppression sauf l'exemplaire gardé) */
  hasExact: boolean;
  /** Même titre nettoyé qu'un autre livre du groupe, mais pas forcément la même édition */
  sameTitle: boolean;
}

export interface DupGroup {
  key: string;
  author: string;
  /** "exact" : au moins deux livres identiques ; "similar" : seulement des titres proches */
  kind: "exact" | "similar";
  books: DupBook[];
}

// Deux livres de même titre sont-ils CERTAINEMENT le même fichier/la même
// édition ? Volontairement strict : une année ou un nombre de pages différent
// signale souvent un autre numéro de revue, un autre tome ou une autre édition.
function isSameCopy(a: DupBook, b: DupBook): boolean {
  if (a.pdfSize && b.pdfSize && a.pdfSize === b.pdfSize) return true;
  if (a.publishedYear && b.publishedYear && a.publishedYear !== b.publishedYear) return false;
  if (a.mediaType === "AUDIO" && b.mediaType === "AUDIO") return true;
  return a.pageCount != null && a.pageCount === b.pageCount;
}

// Plus le score est élevé, plus l'exemplaire mérite d'être gardé.
// L'activité sur le site d'abord (on ne casse pas de favoris/liens), puis la
// présence d'un EPUB, les vues, la couverture.
function keeperRank(a: DupBook, b: DupBook): number {
  return (
    Number(b.isFeatured) - Number(a.isFeatured) ||
    b.downloadCount - a.downloadCount ||
    b.favorites + b.reviews + b.collections - (a.favorites + a.reviews + a.collections) ||
    Number(b.isPublished) - Number(a.isPublished) ||
    Number(b.hasEpub) - Number(a.hasEpub) ||
    b.viewCount - a.viewCount ||
    Number(!!b.coverImage) - Number(!!a.coverImage) ||
    a.title.length - b.title.length
  );
}

export async function findDuplicateGroups(): Promise<DupGroup[]> {
  const rows = await prisma.book.findMany({ select: SELECT, orderBy: { createdAt: "asc" } });

  // Regroupement par auteur
  const byAuthor = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = authorKey(r.author);
    if (!k) continue;
    const list = byAuthor.get(k);
    if (list) list.push(r);
    else byAuthor.set(k, [r]);
  }

  const groups: DupGroup[] = [];

  for (const [aKey, list] of byAuthor) {
    if (list.length < 2) continue;
    const keys = list.map((r) => cleanTitleKey(r.title, r.author));

    // Union-find sur les livres de l'auteur
    const parent = list.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const union = (i: number, j: number) => {
      const a = find(i), b = find(j);
      if (a !== b) parent[b] = a;
    };
    for (let i = 0; i < list.length; i++) {
      if (!keys[i]) continue;
      for (let j = i + 1; j < list.length; j++) {
        if (keys[j] && isSimilar(keys[i], keys[j])) union(i, j);
      }
    }

    const clusters = new Map<number, number[]>();
    list.forEach((_, i) => {
      if (!keys[i]) return;
      const root = find(i);
      const c = clusters.get(root);
      if (c) c.push(i);
      else clusters.set(root, [i]);
    });

    for (const idx of clusters.values()) {
      if (idx.length < 2) continue;
      const books: DupBook[] = idx.map((i) => {
        const r = list[i];
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          language: r.language,
          mediaType: r.mediaType,
          pageCount: r.pageCount,
          pdfSize: r.pdfSize,
          hasEpub: !!r.epubUrl,
          coverImage: r.coverImage,
          publishedYear: r.publishedYear,
          publisher: r.publisher,
          imported: !!r.sourceId,
          downloadCount: r.downloadCount,
          viewCount: r.viewCount,
          favorites: r._count.favorites,
          reviews: r._count.reviews,
          collections: r._count.collections,
          isPublished: r.isPublished,
          isFeatured: r.isFeatured,
          // Un même titre en deux langues ou deux formats (PDF / audio) n'est pas un doublon
          exactKey: `${keys[i]}|${r.language}|${r.mediaType}`,
          isKeeper: false,
          hasExact: false,
          sameTitle: false,
        };
      });

      const sub = new Map<string, DupBook[]>();
      for (const b of books) {
        const s = sub.get(b.exactKey);
        if (s) s.push(b);
        else sub.set(b.exactKey, [b]);
      }
      let kind: DupGroup["kind"] = "similar";
      for (const s of sub.values()) {
        if (s.length < 2) continue;
        s.forEach((b) => (b.sameTitle = true));
        // Même titre ne veut pas dire même livre (revues, tomes sans numéro,
        // autres éditions) : on ne retient comme copies que celles qui sont
        // certaines, en rattachant chaque livre à la première copie compatible.
        s.sort(keeperRank);
        const copies: DupBook[][] = [];
        for (const b of s) {
          const c = copies.find((c) => isSameCopy(c[0], b));
          if (c) c.push(b);
          else copies.push([b]);
        }
        for (const c of copies) {
          if (c.length < 2) continue;
          kind = "exact";
          c.forEach((b, n) => {
            b.hasExact = true;
            b.isKeeper = n === 0;
          });
        }
      }

      // Identiques d'abord (gardé en tête), puis les titres seulement proches
      books.sort(
        (a, b) =>
          Number(b.hasExact) - Number(a.hasExact) ||
          Number(b.sameTitle) - Number(a.sameTitle) ||
          a.exactKey.localeCompare(b.exactKey) ||
          Number(b.isKeeper) - Number(a.isKeeper) ||
          keeperRank(a, b)
      );

      groups.push({ key: `${aKey}#${books[0].id}`, author: list[idx[0]].author, kind, books });
    }
  }

  groups.sort(
    (a, b) =>
      Number(b.kind === "exact") - Number(a.kind === "exact") ||
      b.books.length - a.books.length ||
      a.author.localeCompare(b.author)
  );
  return groups;
}
