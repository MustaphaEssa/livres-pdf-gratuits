"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, Loader2, Search, Square, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";
import { SUGGESTED_AUTHORS } from "@/lib/suggested-authors";

interface Job {
  status: "running" | "done" | "error";
  author: string;
  found: number;
  imported: number;
  skipped: number;
  log: string[];
  error?: string;
}

interface AuthorStatus {
  name: string;
  slug: string;
  inDb: number;
  fullyImported: boolean;
}

export default function AdminImportPage() {
  const [author, setAuthor] = useState("");
  const [max, setMax] = useState(20);
  const [minDownloads, setMinDownloads] = useState(100);
  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [runningAuthor, setRunningAuthor] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState<AuthorStatus[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = job?.status === "running";

  // Charge le statut (compte + « à jour ») de chaque auteur suggéré
  const fetchStatuses = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/import/authors-status");
      if (!r.ok) return;
      const d = await r.json();
      setStatuses(d.authors as AuthorStatus[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatuses]);

  // Démarre un import (manuel ou « tout importer ») et suit sa progression
  const startJob = async (opts: { author: string; all?: boolean; max?: number }) => {
    if (starting || running) return;
    setStarting(true);
    setStopping(false);
    setError("");
    setJob(null);
    setJobId(null);
    setRunningAuthor(opts.author);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: opts.author, all: opts.all, max: opts.max, minDownloads }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du démarrage");

      const id = data.jobId as string;
      setJobId(id);
      pollRef.current = setInterval(async () => {
        const r = await fetch(`/api/admin/import?jobId=${id}`);
        if (!r.ok) return;
        const j: Job = await r.json();
        setJob(j);
        if (j.status !== "running" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setRunningAuthor(null);
          fetchStatuses(); // rafraîchit les puces « à jour »
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setRunningAuthor(null);
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim()) return;
    startJob({ author: author.trim(), max });
  };

  // Demande l'arrêt de l'import en cours (les livres déjà importés sont gardés)
  const handleStop = async () => {
    if (!jobId || stopping) return;
    setStopping(true);
    try {
      await fetch(`/api/admin/import?jobId=${jobId}`, { method: "DELETE" });
    } catch {
      /* la boucle s'arrêtera au prochain tour */
    }
  };

  return (
    <AdminShell active="import">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Importer des livres
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Depuis Internet Archive (livres du domaine public). Importe un auteur
          précis, ou télécharge d&apos;un coup <strong>tout le corpus</strong> d&apos;un
          auteur listé ci-dessous.
        </p>

        {/* Import manuel (auteur libre + nombre) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Import par auteur (manuel)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Auteur *</label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="ex. Victor Hugo"
                  disabled={running}
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="w-32">
                  <label className="block text-sm font-medium mb-1">Nombre max</label>
                  <Input
                    type="number"
                    min={1}
                    max={300}
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    disabled={running}
                  />
                </div>
                <div className="w-44">
                  <label className="block text-sm font-medium mb-1">
                    Popularité min.
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={minDownloads}
                    onChange={(e) => setMinDownloads(Math.max(0, Number(e.target.value)))}
                    disabled={running}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La catégorie est détectée automatiquement d&apos;après les sujets du livre.
                N&apos;importe que les livres ayant au moins ce nombre de
                téléchargements sur Internet Archive (0 = tout importer). S&apos;applique
                aussi à « Tout importer ».
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={starting || running || !author.trim()}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {starting || running ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {running ? "Import en cours…" : "Importer"}
                </Button>
                {running && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleStop}
                    disabled={stopping}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/10"
                  >
                    {stopping ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    {stopping ? "Arrêt…" : "Arrêter"}
                  </Button>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          </CardContent>
        </Card>

        {/* Auteurs suggérés : statut + import complet */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Auteurs du domaine public</CardTitle>
            <button
              type="button"
              onClick={fetchStatuses}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600"
              title="Rafraîchir les statuts"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </button>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              « Tout importer » télécharge l&apos;intégralité des œuvres disponibles de
              l&apos;auteur, au fur et à mesure. La puce{" "}
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 text-[11px] font-medium text-green-700">
                <Check className="h-3 w-3" /> À jour
              </span>{" "}
              apparaît quand il n&apos;y a plus rien de nouveau.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_AUTHORS.map((name) => {
                const st = statuses.find((s) => s.name === name);
                const inDb = st?.inDb ?? 0;
                const done = st?.fullyImported ?? false;
                const isRunning = runningAuthor === name;
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {name}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{inDb} livre{inDb > 1 ? "s" : ""}</span>
                        {done && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 font-medium text-green-700 dark:bg-green-500/15 dark:text-green-400">
                            <Check className="h-3 w-3" /> À jour
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={done ? "outline" : "default"}
                      disabled={running}
                      onClick={() => startJob({ author: name, all: true })}
                      className={
                        done
                          ? "shrink-0"
                          : "shrink-0 bg-amber-500 hover:bg-amber-600"
                      }
                    >
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : done ? (
                        "Revérifier"
                      ) : inDb > 0 ? (
                        "Compléter"
                      ) : (
                        "Tout importer"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Journal de progression */}
        {job && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {job.author} — {job.imported} importé(s), {job.skipped} doublon(s)
                {job.found > 0 && ` · ${job.found} trouvé(s)`}
              </CardTitle>
              {running ? (
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> en cours
                </span>
              ) : job.status === "done" ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Download className="h-4 w-4" /> terminé
                </span>
              ) : (
                <span className="text-sm text-red-500">erreur</span>
              )}
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm font-mono space-y-1">
                {job.log.map((line, i) => (
                  <div key={i} className="text-slate-700 dark:text-slate-300">{line}</div>
                ))}
                {job.error && <div className="text-red-500">{job.error}</div>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
