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
  const [mediaType, setMediaType] = useState<"PDF" | "AUDIO">("PDF");
  const [source, setSource] = useState<"gutenberg" | "ia">("gutenberg");
  const [withAudio, setWithAudio] = useState(true);
  const [max, setMax] = useState(20);
  const [minDownloads, setMinDownloads] = useState(100);
  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [runningAuthor, setRunningAuthor] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState<AuthorStatus[]>([]);
  const [discovered, setDiscovered] = useState<
    { name: string; slug: string; count: number }[] | null
  >(null);
  const [discoverBusy, setDiscoverBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = job?.status === "running";

  // Découvre d'autres auteurs Gutenberg FR pas encore en base
  const fetchDiscovered = useCallback(async () => {
    setDiscoverBusy(true);
    try {
      const r = await fetch("/api/admin/import/discover-authors?max=40");
      if (r.ok) setDiscovered((await r.json()).authors);
    } finally {
      setDiscoverBusy(false);
    }
  }, []);

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
  const startJob = async (opts: {
    author: string;
    all?: boolean;
    max?: number;
    mediaType?: "PDF" | "AUDIO";
    source?: "ia" | "gutenberg";
  }) => {
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
        body: JSON.stringify({
          author: opts.author,
          all: opts.all,
          max: opts.max,
          minDownloads,
          mediaType: opts.mediaType ?? "PDF",
          source: opts.source ?? source,
          withAudio,
        }),
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
    startJob({ author: author.trim(), max, mediaType });
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

  // --- Fusion des doublons multi-format ---
  interface MergeGroupUI {
    key: string;
    title: string;
    books: { id: string; mediaType: string; hasPdf: boolean; hasEpub: boolean; hasAudio: boolean }[];
  }
  const [mergeInfo, setMergeInfo] = useState<{ total: number; duplicates: number; groups: MergeGroupUI[] } | null>(null);
  const [mergeBusy, setMergeBusy] = useState(false);
  const analyzeMerge = async () => {
    setMergeBusy(true);
    try {
      const r = await fetch("/api/admin/merge");
      if (r.ok) setMergeInfo(await r.json());
    } finally {
      setMergeBusy(false);
    }
  };
  const applyMerge = async () => {
    setMergeBusy(true);
    try {
      await fetch("/api/admin/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      await analyzeMerge();
      fetchStatuses();
    } finally {
      setMergeBusy(false);
    }
  };

  // --- Réimport léger (Gutenberg) des livres lourds ---
  const [heavy, setHeavy] = useState<{ id: string; title: string; sizeMb: number }[] | null>(null);
  const [reimportBusy, setReimportBusy] = useState(false);
  const [reimportLog, setReimportLog] = useState<string[]>([]);
  const listHeavy = async () => {
    setReimportBusy(true);
    try {
      const r = await fetch("/api/admin/reimport?minMb=5");
      if (r.ok) setHeavy((await r.json()).books);
    } finally {
      setReimportBusy(false);
    }
  };
  const reimportAll = async () => {
    if (!heavy || !heavy.length) return;
    setReimportBusy(true);
    setReimportLog([]);
    let saved = 0;
    for (const b of heavy) {
      try {
        const r = await fetch("/api/admin/reimport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: b.id }),
        });
        const d = await r.json();
        if (d.status === "ok") {
          const gain = (d.oldMb ?? 0) - (d.newMb ?? 0);
          if (gain > 0) saved += gain;
          setReimportLog((l) => [`✓ ${b.title.slice(0, 42)} : ${d.oldMb} → ${d.newMb} Mo`, ...l].slice(0, 200));
        } else {
          const why = d.status === "nomatch" ? "pas de version plus légère trouvée" : d.status;
          setReimportLog((l) => [`⏭️ ${b.title.slice(0, 42)} : ${why}`, ...l].slice(0, 200));
        }
      } catch {
        setReimportLog((l) => [`✗ ${b.title.slice(0, 42)}`, ...l].slice(0, 200));
      }
    }
    setReimportLog((l) => [`✅ Terminé — ~${Math.round(saved)} Mo libérés`, ...l]);
    await listHeavy();
    setReimportBusy(false);
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
              {/* Source d'import */}
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {([
                    { v: "gutenberg", label: "Gutenberg (léger)" },
                    { v: "ia", label: "Internet Archive (scans)" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setSource(opt.v)}
                      disabled={running || mediaType === "AUDIO"}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                        source === opt.v && mediaType !== "AUDIO"
                          ? "bg-amber-500 text-white"
                          : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {mediaType === "AUDIO"
                    ? "Les livres audio proviennent toujours d'Internet Archive (LibriVox)."
                    : source === "gutenberg"
                    ? "Fichiers texte propres : PDF généré + EPUB, légers (~1 Mo). Domaine public."
                    : "Scans d'Internet Archive, souvent lourds (20–50 Mo)."}
                </p>
              </div>
              {/* Type de média */}
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {([
                    { v: "PDF", label: "Livres PDF" },
                    { v: "AUDIO", label: "Livres audio" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setMediaType(opt.v)}
                      disabled={running}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                        mediaType === opt.v
                          ? "bg-amber-500 text-white"
                          : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {mediaType === "AUDIO" ? "Auteur ou titre *" : "Auteur *"}
                </label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={mediaType === "AUDIO" ? "ex. Jules Verne, ou un titre" : "ex. Victor Hugo"}
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
              <label
                className={`flex items-center gap-2 text-sm ${
                  mediaType === "AUDIO" ? "opacity-40" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={withAudio && mediaType !== "AUDIO"}
                  onChange={(e) => setWithAudio(e.target.checked)}
                  disabled={running || mediaType === "AUDIO"}
                  className="h-4 w-4 accent-amber-500"
                />
                Récupérer aussi l&apos;audio (LibriVox) si l&apos;œuvre existe — une seule fiche PDF +
                EPUB + Audio
              </label>
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

        {/* Découverte dynamique d'auteurs Gutenberg pas encore importés */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Découvrir d&apos;autres auteurs</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={fetchDiscovered}
              disabled={discoverBusy}
            >
              {discoverBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" /> Explorer le catalogue
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Auteurs du catalogue Project Gutenberg (français, domaine public){" "}
              <strong>pas encore dans ta base</strong>, classés par nombre
              d&apos;œuvres disponibles. « Importer » télécharge toutes leurs œuvres
              depuis Gutenberg (fichiers légers).
            </p>
            {discovered === null ? (
              <p className="text-sm text-slate-400">
                Clique sur « Explorer le catalogue » pour lister de nouveaux auteurs.
              </p>
            ) : discovered.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun nouvel auteur trouvé (tous déjà importés ou déjà listés).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {discovered.map((a) => {
                  const isRunning = runningAuthor === a.name;
                  return (
                    <div
                      key={a.slug}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {a.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.count} œuvre{a.count > 1 ? "s" : ""} au catalogue
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={running}
                        onClick={() =>
                          startJob({ author: a.name, all: true, source: "gutenberg" })
                        }
                        className="shrink-0 bg-amber-500 hover:bg-amber-600"
                      >
                        {isRunning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Importer"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fusion des doublons multi-format */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Fusionner les doublons (multi-format)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Regroupe en une seule fiche les exemplaires d&apos;une même œuvre (PDF + EPUB + Audio)
              répartis sur plusieurs entrées. Garde le PDF le plus léger ; les fichiers inutiles sont
              supprimés.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button type="button" variant="outline" onClick={analyzeMerge} disabled={mergeBusy}>
                {mergeBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Analyser les doublons
              </Button>
              {mergeInfo && mergeInfo.total > 0 && (
                <Button
                  type="button"
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={applyMerge}
                  disabled={mergeBusy}
                >
                  Fusionner {mergeInfo.total} œuvre(s)
                </Button>
              )}
            </div>
            {mergeInfo &&
              (mergeInfo.total === 0 ? (
                <p className="text-sm text-green-600">Aucun doublon détecté. ✓</p>
              ) : (
                <>
                  <p className="text-sm mb-2">
                    {mergeInfo.total} œuvre(s) en double · {mergeInfo.duplicates} fiche(s) à supprimer.
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {mergeInfo.groups.slice(0, 60).map((g) => (
                      <div
                        key={g.key}
                        className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1"
                      >
                        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {g.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {g.books
                            .map(
                              (b) =>
                                [b.hasPdf && "PDF", b.hasEpub && "EPUB", b.hasAudio && "Audio"]
                                  .filter(Boolean)
                                  .join("+") || b.mediaType
                            )
                            .join("  ·  ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ))}
          </CardContent>
        </Card>

        {/* Réimport léger (Gutenberg) des livres lourds */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Alléger les livres lourds (réimport Gutenberg)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Repère les PDF lourds (≥ 5 Mo, souvent des scans) et remplace le fichier par une version
              plus légère : d&apos;abord Gutenberg (texte → PDF généré + EPUB), sinon le PDF le plus léger
              de la même œuvre sur Internet Archive. La fiche et ses liens sont conservés.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Button type="button" variant="outline" onClick={listHeavy} disabled={reimportBusy}>
                {reimportBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Lister les livres lourds
              </Button>
              {heavy && heavy.length > 0 && (
                <Button
                  type="button"
                  className="bg-amber-500 hover:bg-amber-600"
                  onClick={reimportAll}
                  disabled={reimportBusy}
                >
                  Alléger {heavy.length} livre(s)
                </Button>
              )}
            </div>
            {heavy && (
              <p className="text-sm mb-2">
                {heavy.length === 0
                  ? "Aucun livre lourd (≥ 5 Mo). ✓"
                  : `${heavy.length} livre(s) lourd(s) · ${Math.round(
                      heavy.reduce((s, b) => s + b.sizeMb, 0)
                    )} Mo au total.`}
              </p>
            )}
            {reimportLog.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm font-mono space-y-1">
                {reimportLog.map((line, i) => (
                  <div key={i} className="text-slate-700 dark:text-slate-300">
                    {line}
                  </div>
                ))}
              </div>
            )}
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
