"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Loader2, Trash2, AlertTriangle, Copy, ExternalLink, Pencil, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";

interface DupBook {
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
  exactKey: string;
  isKeeper: boolean;
  hasExact: boolean;
  sameTitle: boolean;
}

interface DupGroup {
  key: string;
  author: string;
  kind: "exact" | "similar";
  books: DupBook[];
}

interface Data {
  groups: DupGroup[];
  exactGroups: number;
  similarGroups: number;
  suggested: number;
}

type Tab = "exact" | "similar";
const PAGE = 30;

function fmtMb(bytes: number | null): string {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export default function AdminDoublonsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("exact");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/doublons");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec du chargement");
      const d = json as Data;
      setData(d);
      // Pré-coche les exemplaires identiques non recommandés
      setSelected(
        new Set(d.groups.flatMap((g) => g.books.filter((b) => b.hasExact && !b.isKeeper).map((b) => b.id)))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.groups.filter(
      (g) =>
        g.kind === tab &&
        (!q ||
          g.author.toLowerCase().includes(q) ||
          g.books.some((b) => b.title.toLowerCase().includes(q)))
    );
  }, [data, tab, query]);

  useEffect(() => setShown(PAGE), [tab, query]);

  const toggle = (id: string) => {
    setConfirm(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Les livres cochés qui sont visibles avec le filtre courant : c'est ce que
  // l'admin voit, donc c'est ce qu'on supprime (évite de supprimer en aveugle
  // des livres cochés dans l'autre onglet).
  const toDelete = useMemo(
    () => visible.flatMap((g) => g.books.filter((b) => selected.has(b.id))),
    [visible, selected]
  );

  const doDelete = async () => {
    if (!toDelete.length || deleting) return;
    setDeleting(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/doublons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: toDelete.map((b) => b.id) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec de la suppression");
      setMessage(`${json.deleted} livre(s) supprimé(s).`);
      setConfirm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell active="doublons">
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Doublons</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Livres d&apos;un même auteur dont les titres sont identiques une fois nettoyés
          (nom d&apos;auteur, année, langue, mention de site retirés) ou très proches.
          <strong>Identiques</strong> : copies certaines (même fichier, ou même année et même
          nombre de pages). L&apos;exemplaire <strong>à garder</strong> est celui qui a le plus
          d&apos;activité sur le site, puis un EPUB, puis le plus de vues ; les copies sont
          pré-cochées. <strong>Similaires</strong> : même titre mais autre année/édition, ou
          titres proches (recueils) — rien n&apos;est coché, à toi de choisir.
        </p>

        {loading && !data ? (
          <div className="flex items-center gap-2 text-slate-500 p-6">
            <Loader2 className="h-5 w-5 animate-spin" /> Recherche des doublons…
          </div>
        ) : error && !data ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : data ? (
          <>
            {/* Barre d'outils, collée en haut pendant le défilement */}
            <div className="sticky top-0 z-10 -mx-2 px-2 py-3 mb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["exact", `Identiques (${data.exactGroups})`],
                    ["similar", `Similaires (${data.similarGroups})`],
                  ] as [Tab, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTab(key);
                      setConfirm(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      tab === key
                        ? "bg-[#14213D] text-white"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <div className="relative ml-auto w-full sm:w-64">
                  <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Auteur ou titre…"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!confirm ? (
                  <Button
                    onClick={() => setConfirm(true)}
                    disabled={!toDelete.length || deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer les cochés ({toDelete.length})
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      Supprimer définitivement {toDelete.length} livre(s) et leurs fichiers ?
                    </span>
                    <Button size="sm" onClick={doDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                      {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Oui, supprimer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirm(false)} disabled={deleting}>
                      Annuler
                    </Button>
                  </div>
                )}
                <span className="text-sm text-slate-500">
                  {visible.length} groupe(s){query && " (filtrés)"}
                </span>
                {message && <span className="text-sm text-green-600">{message}</span>}
                {error && <span className="text-sm text-red-500">{error}</span>}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="text-slate-500 p-6 text-center">Aucun groupe dans cet onglet.</p>
            ) : (
              <div className="space-y-4">
                {visible.slice(0, shown).map((g) => (
                  <Card key={g.key}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <Copy className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{g.author}</span>
                        <span className="text-slate-500">· {g.books.length} livres</span>
                      </div>
                      <div className="space-y-2">
                        {g.books.map((b) => (
                          <label
                            key={b.id}
                            className={`flex gap-3 rounded-md border p-2 cursor-pointer ${
                              selected.has(b.id)
                                ? "border-red-300 bg-red-50/60 dark:border-red-900/50 dark:bg-red-900/10"
                                : b.isKeeper
                                  ? "border-green-300 bg-green-50/60 dark:border-green-900/50 dark:bg-green-900/10"
                                  : "border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(b.id)}
                              onChange={() => toggle(b.id)}
                              className="mt-1 h-4 w-4 accent-red-600 shrink-0"
                            />
                            {b.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={b.coverImage}
                                alt=""
                                loading="lazy"
                                className="w-10 h-14 object-cover rounded shrink-0 bg-slate-100"
                              />
                            ) : (
                              <div className="w-10 h-14 rounded bg-slate-100 dark:bg-slate-800 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium text-slate-800 dark:text-slate-200 break-words">
                                  {b.title}
                                </span>
                                {b.isKeeper && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 px-1.5 py-0.5 text-[11px] font-medium">
                                    <Star className="h-3 w-3" /> À garder
                                  </span>
                                )}
                                {b.hasExact && !b.isKeeper && (
                                  <span className="rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 px-1.5 py-0.5 text-[11px] font-medium">
                                    Copie
                                  </span>
                                )}
                                {!b.hasExact && (
                                  <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                                    {b.sameTitle
                                      ? "Même titre — autre édition ou volume ?"
                                      : "Titre différent — à vérifier"}
                                  </span>
                                )}
                                {!b.isPublished && (
                                  <span className="rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[11px]">
                                    Non publié
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                <span>{b.language.toUpperCase()}</span>
                                {b.mediaType === "AUDIO" && <span>Audio</span>}
                                {b.publishedYear && <span>{b.publishedYear}</span>}
                                {b.publisher && <span className="truncate max-w-[14rem]">{b.publisher}</span>}
                                <span>{b.pageCount ? `${b.pageCount} p.` : "— p."}</span>
                                <span>{fmtMb(b.pdfSize)}</span>
                                <span className={b.hasEpub ? "text-green-600" : ""}>
                                  {b.hasEpub ? "EPUB ✓" : "sans EPUB"}
                                </span>
                                <span>{b.downloadCount} téléch.</span>
                                <span>{b.viewCount} vues</span>
                                {b.favorites + b.reviews + b.collections > 0 && (
                                  <span className="text-amber-600">
                                    {b.favorites} fav. · {b.reviews} avis · {b.collections} coll.
                                  </span>
                                )}
                                <span>{b.imported ? "importé" : "ajouté à la main"}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <a
                                href={`/livre/${b.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 text-slate-400 hover:text-amber-600"
                                title="Voir la fiche"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <Link
                                href={`/admin/livres/${b.id}/modifier`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 text-slate-400 hover:text-amber-600"
                                title="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </div>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {shown < visible.length && (
                  <div className="text-center">
                    <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                      Afficher plus ({visible.length - shown} restants)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
