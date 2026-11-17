"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
  Headphones,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatAuthorName } from "@/lib/utils";

interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImage: string | null;
  categories: { category: { name: string; slug: string } }[];
  language: string;
  mediaType: string;
  downloadCount: number;
  viewCount: number;
  rating: number;
  ratingCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface ListResponse {
  books: Book[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  languages: { code: string; count: number }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
  _count?: { books: number };
}

// Filtres gardés dans l'URL : partageables et conservés au retour arrière
const FILTER_KEYS = ["q", "author", "category", "status", "media", "lang", "dlMin", "dlMax", "noCover"] as const;

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "downloads", label: "Plus téléchargés" },
  { value: "downloads_asc", label: "Moins téléchargés" },
  { value: "views", label: "Plus vus" },
  { value: "rating", label: "Mieux notés" },
  { value: "title", label: "Titre (A → Z)" },
  { value: "author", label: "Auteur (A → Z)" },
];

const DOWNLOAD_PRESETS = [
  { label: "Tous", min: "", max: "" },
  { label: "0", min: "0", max: "0" },
  { label: "1 – 9", min: "1", max: "9" },
  { label: "10 – 99", min: "10", max: "99" },
  { label: "100+", min: "100", max: "" },
];

const LANG_NAMES: Record<string, string> = {
  fr: "Français", en: "Anglais", ar: "Arabe", es: "Espagnol", de: "Allemand",
  it: "Italien", pt: "Portugais", nl: "Néerlandais", tr: "Turc", la: "Latin", ru: "Russe",
};

const selectCls =
  "h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm";

export default function AdminBooksPage() {
  return (
    <Suspense>
      <BooksList />
    </Suspense>
  );
}

function BooksList() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(() =>
    FILTER_KEYS.some((k) => k !== "q" && sp.get(k))
  );

  // Champs texte : saisie locale, appliquée à l'URL après une courte pause
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [author, setAuthor] = useState(sp.get("author") ?? "");
  const [dlMin, setDlMin] = useState(sp.get("dlMin") ?? "");
  const [dlMax, setDlMax] = useState(sp.get("dlMax") ?? "");

  const query = sp.toString();

  const setParams = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (resetPage) next.delete("page");
      const s = next.toString();
      if (s !== sp.toString()) router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [sp, router, pathname]
  );

  // Synchronise les champs texte vers l'URL (debounce 350 ms)
  const pushed = useRef("");
  useEffect(() => {
    const id = setTimeout(() => {
      pushed.current = [q, author, dlMin, dlMax].join("\u0000");
      setParams({ q, author, dlMin, dlMax });
    }, 350);
    return () => clearTimeout(id);
  }, [q, author, dlMin, dlMax]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si l'URL change de l'extérieur (retour arrière, « Tout effacer »…), met à jour
  // les champs — mais pas quand c'est notre propre saisie (évite d'écraser la frappe en cours)
  useEffect(() => {
    const fromUrl = ["q", "author", "dlMin", "dlMax"].map((k) => sp.get(k) ?? "").join("\u0000");
    if (fromUrl === pushed.current) return;
    pushed.current = fromUrl;
    setQ(sp.get("q") ?? "");
    setAuthor(sp.get("author") ?? "");
    setDlMin(sp.get("dlMin") ?? "");
    setDlMax(sp.get("dlMax") ?? "");
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/livres?${query}`);
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error("Erreur de chargement des livres :", error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) => setCategories((d.categories ?? []).filter((c: Category) => c.type !== "BLOG")))
      .catch(() => {});
  }, []);

  const patchBook = async (id: string, patch: Partial<Book>) => {
    const res = await fetch(`/api/admin/livres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const { book } = await res.json();
      setData((prev) =>
        prev && { ...prev, books: prev.books.map((b) => (b.id === id ? { ...b, ...book, categories: b.categories } : b)) }
      );
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`${t.admin.confirmDeleteBook}\n\n« ${title} »`)) return;
    const res = await fetch(`/api/admin/livres/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else window.alert("La suppression a échoué.");
  };

  const sort = sp.get("sort") ?? "recent";
  const page = data?.page ?? Number(sp.get("page") ?? 1);
  const pages = data?.pages ?? 1;
  const pageSize = data?.pageSize ?? 25;
  const total = data?.total ?? 0;
  const books = data?.books ?? [];

  // Filtres actifs (puces supprimables)
  const chips = useMemo(() => {
    const list: { key: string[]; label: string }[] = [];
    const v = (k: string) => sp.get(k);
    if (v("q")) list.push({ key: ["q"], label: `« ${v("q")} »` });
    if (v("author")) list.push({ key: ["author"], label: `Auteur : ${v("author")}` });
    if (v("category")) {
      const c = v("category") === "none" ? "Sans catégorie" : categories.find((c) => c.slug === v("category"))?.name ?? v("category");
      list.push({ key: ["category"], label: `Catégorie : ${c}` });
    }
    if (v("status"))
      list.push({ key: ["status"], label: { published: "Publiés", draft: "Brouillons", featured: "En vedette" }[v("status")!] ?? v("status")! });
    if (v("media")) list.push({ key: ["media"], label: v("media") === "AUDIO" ? "Livres audio" : "PDF" });
    if (v("lang")) list.push({ key: ["lang"], label: `Langue : ${LANG_NAMES[v("lang")!] ?? v("lang")}` });
    if (v("dlMin") || v("dlMax")) {
      const min = v("dlMin"), max = v("dlMax");
      const label = min && max ? (min === max ? `${min}` : `${min} – ${max}`) : min ? `≥ ${min}` : `≤ ${max}`;
      list.push({ key: ["dlMin", "dlMax"], label: `Téléchargements : ${label}` });
    }
    if (v("noCover")) list.push({ key: ["noCover"], label: "Sans couverture" });
    return list;
  }, [sp, categories]);

  const clearAll = () => {
    const patch: Record<string, null> = {};
    FILTER_KEYS.forEach((k) => (patch[k] = null));
    setParams(patch);
  };

  // Tri en cliquant sur l'en-tête de colonne
  const sortHeader = (label: string, desc: string, asc?: string) => {
    const active = sort === desc || sort === asc;
    const next = sort === desc && asc ? asc : desc;
    return (
      <button
        onClick={() => setParams({ sort: next === "recent" ? null : next })}
        className={`inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white ${active ? "text-slate-900 dark:text-white" : ""}`}
      >
        {label}
        {active && (sort === asc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
      </button>
    );
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <AdminShell active="livres">
      {/* Titre */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.admin.booksTitle}</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {data ? `${total.toLocaleString("fr-FR")} ${t.admin.booksWord}${chips.length ? " (filtrés)" : ""}` : "…"}
          </p>
        </div>
        <Link href="/admin/livres/ajouter">
          <Button className="bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4 mr-2" />
            {t.admin.addBook}
          </Button>
        </Link>
      </div>

      {/* Recherche, tri et filtres */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un titre, un auteur…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
                aria-label="Rechercher"
              />
            </div>
            <select
              className={selectCls}
              value={sort}
              onChange={(e) => setParams({ sort: e.target.value === "recent" ? null : e.target.value })}
              aria-label="Trier par"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Tri : {o.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
              className="h-10"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtres
              {chips.filter((c) => c.key[0] !== "q").length > 0 && (
                <span className="ml-2 rounded-full bg-amber-500 text-white text-xs px-1.5 min-w-5">
                  {chips.filter((c) => c.key[0] !== "q").length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Auteur</span>
                <Input placeholder="Ex. Victor Hugo" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Catégorie</span>
                <select
                  className={`${selectCls} w-full`}
                  value={sp.get("category") ?? ""}
                  onChange={(e) => setParams({ category: e.target.value })}
                >
                  <option value="">Toutes</option>
                  <option value="none">Sans catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                      {c._count ? ` (${c._count.books})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-500">Statut</span>
                <select
                  className={`${selectCls} w-full`}
                  value={sp.get("status") ?? ""}
                  onChange={(e) => setParams({ status: e.target.value })}
                >
                  <option value="">Tous</option>
                  <option value="published">Publiés</option>
                  <option value="draft">Brouillons</option>
                  <option value="featured">En vedette</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Type</span>
                  <select
                    className={`${selectCls} w-full`}
                    value={sp.get("media") ?? ""}
                    onChange={(e) => setParams({ media: e.target.value })}
                  >
                    <option value="">Tous</option>
                    <option value="PDF">PDF</option>
                    <option value="AUDIO">Audio</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Langue</span>
                  <select
                    className={`${selectCls} w-full`}
                    value={sp.get("lang") ?? ""}
                    onChange={(e) => setParams({ lang: e.target.value })}
                  >
                    <option value="">Toutes</option>
                    {(data?.languages ?? []).map((l) => (
                      <option key={l.code} value={l.code}>
                        {LANG_NAMES[l.code] ?? l.code} ({l.count})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-slate-500">Téléchargements</span>
                <div className="flex flex-wrap items-center gap-2">
                  {DOWNLOAD_PRESETS.map((pr) => {
                    const active = (sp.get("dlMin") ?? "") === pr.min && (sp.get("dlMax") ?? "") === pr.max;
                    return (
                      <button
                        key={pr.label}
                        onClick={() => {
                          setDlMin(pr.min);
                          setDlMax(pr.max);
                        }}
                        className={`h-8 px-3 rounded-full text-sm border transition-colors ${
                          active
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500"
                        }`}
                      >
                        {pr.label}
                      </button>
                    );
                  })}
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Input
                      type="number"
                      min={0}
                      placeholder="min"
                      value={dlMin}
                      onChange={(e) => setDlMin(e.target.value)}
                      className="h-8 w-20"
                      aria-label="Téléchargements minimum"
                    />
                    –
                    <Input
                      type="number"
                      min={0}
                      placeholder="max"
                      value={dlMax}
                      onChange={(e) => setDlMax(e.target.value)}
                      className="h-8 w-20"
                      aria-label="Téléchargements maximum"
                    />
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 sm:col-span-2 self-end h-8">
                <input
                  type="checkbox"
                  checked={sp.get("noCover") === "1"}
                  onChange={(e) => setParams({ noCover: e.target.checked ? "1" : null })}
                  className="h-4 w-4 accent-amber-500"
                />
                Sans couverture
              </label>
            </div>
          )}

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <span
                  key={c.key.join()}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs pl-3 pr-1 py-1"
                >
                  {c.label}
                  <button
                    onClick={() => setParams(Object.fromEntries(c.key.map((k) => [k, null])))}
                    className="p-0.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    aria-label={`Retirer le filtre ${c.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline">
                Tout effacer
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau des livres */}
      <Card>
        <CardContent className="p-0">
          {!data && loading ? (
            <div className="p-8 text-center text-slate-500">{t.admin.loading}</div>
          ) : books.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {chips.length ? "Aucun livre ne correspond à ces filtres." : t.admin.noBooks}
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-50" : ""}`}>
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                    <th className="px-4 py-3">{sortHeader(t.admin.colTitle, "title")}</th>
                    <th className="px-4 py-3">{t.admin.colCategory}</th>
                    <th className="px-4 py-3">{t.admin.colStatus}</th>
                    <th className="px-4 py-3 text-right">{sortHeader(t.admin.colDownloads, "downloads", "downloads_asc")}</th>
                    <th className="px-4 py-3 text-right">{sortHeader("Vues", "views")}</th>
                    <th className="px-4 py-3">{sortHeader(t.admin.colRating, "rating")}</th>
                    <th className="px-4 py-3 text-right">{t.admin.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 shrink-0 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden flex items-center justify-center">
                            {book.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={book.coverImage} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                              {book.mediaType === "AUDIO" && (
                                <Headphones className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Livre audio" />
                              )}
                              <span className="line-clamp-2">{book.title}</span>
                            </h4>
                            <button
                              onClick={() => {
                                setShowFilters(true);
                                setAuthor(book.author);
                              }}
                              className="text-sm text-slate-500 hover:text-amber-600 hover:underline text-left"
                              title="Filtrer par cet auteur"
                            >
                              {formatAuthorName(book.author)}
                            </button>
                            <span className="text-xs text-slate-400 uppercase ml-2">{book.language}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {book.categories.map((cat) => (
                            <button
                              key={cat.category.slug}
                              onClick={() => setParams({ category: cat.category.slug })}
                              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                              title="Filtrer par cette catégorie"
                            >
                              {cat.category.name}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => patchBook(book.id, { isPublished: !book.isPublished })}
                          title="Cliquer pour basculer"
                          className={`px-2 py-1 text-xs rounded transition-opacity hover:opacity-80 ${
                            book.isPublished
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          }`}
                        >
                          {book.isPublished ? t.admin.published : t.admin.draft}
                        </button>
                        <button
                          onClick={() => patchBook(book.id, { isFeatured: !book.isFeatured })}
                          title="Cliquer pour basculer la mise en vedette"
                          className={`ml-1 px-2 py-1 text-xs rounded transition-opacity hover:opacity-80 ${
                            book.isFeatured
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-slate-100 text-slate-400 dark:bg-slate-700"
                          }`}
                        >
                          {t.admin.featured}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium text-slate-900 dark:text-white">
                        {book.downloadCount.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums text-slate-600 dark:text-slate-400">
                        {book.viewCount.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Star className={`h-4 w-4 ${book.ratingCount ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {book.ratingCount ? `${book.rating.toFixed(1)} (${book.ratingCount})` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/livre/${book.slug}`}
                            title={t.admin.view}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                          >
                            <Eye className="h-4 w-4 text-slate-400" />
                          </Link>
                          <Link
                            href={`/admin/livres/${book.id}/modifier`}
                            title={t.admin.edit}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                          >
                            <Edit className="h-4 w-4 text-slate-400" />
                          </Link>
                          <button
                            onClick={() => handleDelete(book.id, book.title)}
                            title={t.admin.delete}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>
                {from.toLocaleString("fr-FR")}–{to.toLocaleString("fr-FR")} {t.admin.onWord}{" "}
                {total.toLocaleString("fr-FR")}
              </span>
              <select
                className="h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                value={pageSize}
                onChange={(e) => setParams({ pageSize: e.target.value === "25" ? null : e.target.value })}
                aria-label="Livres par page"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
            <Pagination page={page} pages={pages} onChange={(p) => setParams({ page: p === 1 ? null : String(p) }, false)} />
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;

  // 1 … 4 5 [6] 7 8 … 20
  const nums: (number | "…")[] = [];
  const add = (n: number | "…") => nums.push(n);
  const start = Math.max(2, page - 2);
  const end = Math.min(pages - 1, page + 2);
  add(1);
  if (start > 2) add("…");
  for (let i = start; i <= end; i++) add(i);
  if (end < pages - 1) add("…");
  add(pages);

  const btn = "h-8 min-w-8 px-2 rounded-md text-sm flex items-center justify-center transition-colors";
  const idle = "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button className={`${btn} ${idle}`} onClick={() => onChange(1)} disabled={page === 1} aria-label="Première page">
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button className={`${btn} ${idle}`} onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Page précédente">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${n === page ? "bg-amber-500 text-white font-medium" : idle}`}
          >
            {n}
          </button>
        )
      )}
      <button className={`${btn} ${idle}`} onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Page suivante">
        <ChevronRight className="h-4 w-4" />
      </button>
      <button className={`${btn} ${idle}`} onClick={() => onChange(pages)} disabled={page === pages} aria-label="Dernière page">
        <ChevronsRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
