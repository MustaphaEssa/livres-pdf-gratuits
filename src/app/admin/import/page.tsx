"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";

interface Job {
  status: "running" | "done" | "error";
  author: string;
  found: number;
  imported: number;
  skipped: number;
  log: string[];
  error?: string;
}

// Auteurs classiques du domaine public (morts depuis +70 ans), riches en
// livres français sur Internet Archive → import fiable
const SUGGESTED_AUTHORS = [
  "Victor Hugo",
  "Émile Zola",
  "Honoré de Balzac",
  "Alexandre Dumas",
  "Jules Verne",
  "Gustave Flaubert",
  "Guy de Maupassant",
  "Stendhal",
  "George Sand",
  "Voltaire",
  "Jean-Jacques Rousseau",
  "Molière",
  "Jean de La Fontaine",
  "Charles Baudelaire",
  "Alphonse Daudet",
  "Anatole France",
  "Pierre Loti",
  "Théophile Gautier",
  "Prosper Mérimée",
  "Chateaubriand",
];

export default function AdminImportPage() {
  const [author, setAuthor] = useState("");
  const [max, setMax] = useState(20);
  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const running = job?.status === "running";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || starting || running) return;
    setStarting(true);
    setError("");
    setJob(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim(), max }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du démarrage");

      const jobId = data.jobId as string;
      pollRef.current = setInterval(async () => {
        const r = await fetch(`/api/admin/import?jobId=${jobId}`);
        if (!r.ok) return;
        const j: Job = await r.json();
        setJob(j);
        if (j.status !== "running" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setStarting(false);
    }
  };

  return (
    <AdminShell active="import">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Importer des livres
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Depuis Internet Archive (livres du domaine public). Renseigne un auteur, la
          catégorie et le nombre de livres, puis lance l&apos;import.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Nouvel import par auteur</CardTitle>
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
                <div className="mt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    Auteurs suggérés (domaine public) — clique pour remplir :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_AUTHORS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        disabled={running}
                        onClick={() => setAuthor(a)}
                        className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Nombre max</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={max}
                  onChange={(e) => setMax(Number(e.target.value))}
                  disabled={running}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La catégorie est détectée automatiquement d&apos;après les sujets du livre.
              </p>
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
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
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
