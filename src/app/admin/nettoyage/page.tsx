"use client";

import { useState, useMemo, useCallback } from "react";
import { Loader2, Trash2, Search, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";

interface BookRow {
  id: string;
  slug: string;
  title: string;
  author: string;
  downloads: number | null;
  sizeBytes: number;
  isProtected: boolean;
  reason: string | null;
}

interface Analysis {
  books: BookRow[];
  total: number;
  deletable: number;
  cachedAt: number | null;
}

interface DeleteResult {
  deleted: number;
  skipped: number;
  freedBytes: number;
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} Go`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export default function AdminNettoyagePage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [threshold, setThreshold] = useState(50);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<DeleteResult | null>(null);
  const [error, setError] = useState("");

  const analyze = useCallback(async (refresh = false) => {
    setAnalyzing(true);
    setError("");
    setConfirm(false);
    try {
      const res = await fetch(`/api/admin/nettoyage${refresh ? "?refresh=1" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'analyse");
      setAnalysis(data as Analysis);
      // Pré-sélectionne les livres supprimables sous le seuil courant
      const preset = new Set<string>(
        (data.books as BookRow[])
          .filter((b) => !b.isProtected && (b.downloads ?? Infinity) < threshold)
          .map((b) => b.id)
      );
      setSelected(preset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAnalyzing(false);
    }
  }, [threshold]);

  // Applique le seuil : sélectionne tous les supprimables sous le seuil
  const applyThreshold = () => {
    if (!analysis) return;
    setConfirm(false);
    setSelected(
      new Set(
        analysis.books
          .filter((b) => !b.isProtected && (b.downloads ?? Infinity) < threshold)
          .map((b) => b.id)
      )
    );
  };

  const toggle = (id: string) => {
    setConfirm(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedSizeBytes = useMemo(() => {
    if (!analysis) return 0;
    return analysis.books
      .filter((b) => selected.has(b.id))
      .reduce((sum, b) => sum + b.sizeBytes, 0);
  }, [analysis, selected]);

  const doDelete = async () => {
    if (!selected.size || deleting) return;
    setDeleting(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/nettoyage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la suppression");
      setResult(data as DeleteResult);
      setConfirm(false);
      setSelected(new Set());
      await analyze(true); // recharge l'état après suppression
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell active="nettoyage">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Nettoyage du catalogue
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Libère de l&apos;espace disque en supprimant les livres les{" "}
          <strong>moins populaires sur Internet Archive</strong>. Les livres en
          vedette, consultés, téléchargés ou mis en favori sont{" "}
          <strong>protégés</strong> et ne peuvent pas être supprimés ici.
        </p>

        {/* Lancement de l'analyse */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">1. Analyser</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Récupère la popularité (nombre de téléchargements) de chaque livre
              importé depuis Internet Archive. Peut prendre quelques secondes.
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => analyze(false)}
                disabled={analyzing || deleting}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {analyzing ? "Analyse…" : analysis ? "Ré-analyser" : "Analyser le catalogue"}
              </Button>
              {analysis && (
                <button
                  type="button"
                  onClick={() => analyze(true)}
                  disabled={analyzing || deleting}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600"
                  title="Forcer le rafraîchissement depuis Internet Archive"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir les chiffres
                </button>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {result && (
              <div className="rounded-md bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                ✅ {result.deleted} livre(s) supprimé(s), {fmtSize(result.freedBytes)}{" "}
                libéré(s)
                {result.skipped > 0 && ` · ${result.skipped} protégé(s) ignoré(s)`}.
              </div>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <>
            {/* Sélection par seuil */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">2. Choisir le seuil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Supprimer les livres avec moins de… téléchargements IA
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={threshold}
                      onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))}
                      className="w-40"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={applyThreshold}>
                    Appliquer le seuil
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <span>
                    <strong>{analysis.total}</strong> livres importés
                  </span>
                  <span>
                    <strong>{analysis.deletable}</strong> supprimables (non protégés)
                  </span>
                  <span className="text-amber-700 dark:text-amber-400">
                    <strong>{selected.size}</strong> sélectionné(s) · {fmtSize(selectedSizeBytes)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Suppression */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">3. Supprimer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!confirm ? (
                  <Button
                    onClick={() => setConfirm(true)}
                    disabled={!selected.size || deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer la sélection ({selected.size} · {fmtSize(selectedSizeBytes)})
                  </Button>
                ) : (
                  <div className="rounded-md border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400 mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      Supprimer définitivement {selected.size} livre(s) et leurs
                      fichiers ({fmtSize(selectedSizeBytes)}) ? Action irréversible.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button onClick={doDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                        {deleting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {deleting ? "Suppression…" : "Oui, supprimer"}
                      </Button>
                      <Button variant="outline" onClick={() => setConfirm(false)} disabled={deleting}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Liste détaillée */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Détail (du moins au plus populaire)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[32rem] overflow-y-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-slate-800">
                      <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-2 py-2 w-8"></th>
                        <th className="px-2 py-2">Titre</th>
                        <th className="px-2 py-2 text-right whitespace-nowrap">Téléch. IA</th>
                        <th className="px-2 py-2 text-right whitespace-nowrap">Taille</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.books.map((b) => (
                        <tr
                          key={b.id}
                          className={`border-b border-slate-100 dark:border-slate-700/50 ${
                            b.isProtected ? "opacity-60" : ""
                          }`}
                        >
                          <td className="px-2 py-2 align-top">
                            <input
                              type="checkbox"
                              checked={selected.has(b.id)}
                              disabled={b.isProtected}
                              onChange={() => toggle(b.id)}
                              className="mt-0.5 h-4 w-4 accent-red-600"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                              {b.title}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5">
                              <span className="truncate">{b.author}</span>
                              {b.isProtected && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  <ShieldCheck className="h-3 w-3" /> {b.reason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400">
                            {b.downloads === null ? "—" : b.downloads.toLocaleString("fr-FR")}
                          </td>
                          <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400">
                            {fmtSize(b.sizeBytes)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}
