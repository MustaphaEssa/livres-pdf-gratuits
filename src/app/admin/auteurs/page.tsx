"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, Search, Users, Merge, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";

interface AuthorRow {
  slug: string;
  name: string;
  count: number;
  hasImage: boolean;
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [merging, setMerging] = useState(false);
  const [message, setMessage] = useState("");
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoRunning, setPhotoRunning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auteurs");
      if (res.ok) setAuthors((await res.json()).authors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const fetchMissingPhotos = async () => {
    setPhotoRunning(true);
    setPhotoStatus("Démarrage…");
    const res = await fetch("/api/admin/auteurs/photos", { method: "POST" });
    const { jobId } = await res.json();
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/admin/auteurs/photos?jobId=${jobId}`);
      if (!r.ok) return;
      const j = await r.json();
      setPhotoStatus(`${j.done}/${j.total} traités — ${j.withPhoto} photo(s) trouvée(s)`);
      if (j.status !== "running" && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setPhotoRunning(false);
        setPhotoStatus(`✅ Terminé — ${j.withPhoto} photo(s) ajoutée(s).`);
        fetchAuthors();
      }
    }, 2000);
  };

  const filtered = useMemo(
    () => authors.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())),
    [authors, query]
  );

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      if (!next.includes(target)) setTarget(next[0] ?? "");
      return next;
    });
  };

  const selectedAuthors = authors.filter((a) => selected.includes(a.slug));

  const handleMerge = async () => {
    if (selected.length < 2 || !target) return;
    setMerging(true);
    setMessage("");
    const res = await fetch("/api/admin/auteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: selected, targetSlug: target }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ ${data.booksMoved} livre(s) regroupé(s) sous un seul auteur.`);
      setSelected([]);
      setTarget("");
      await fetchAuthors();
    } else {
      setMessage(data.error || "Échec de la fusion.");
    }
    setMerging(false);
  };

  return (
    <AdminShell active="auteurs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auteurs</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {authors.length} auteur(s) — coche plusieurs entrées du même auteur pour les fusionner.
          </p>
        </div>
        <Button onClick={fetchMissingPhotos} disabled={photoRunning} variant="outline">
          {photoRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageDown className="h-4 w-4 mr-2" />}
          Récupérer les photos manquantes
        </Button>
      </div>
      {photoStatus && <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{photoStatus}</p>}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher un auteur…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Barre de fusion */}
      {selected.length >= 2 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <span className="text-sm text-amber-700 dark:text-amber-400">
            {selected.length} auteurs sélectionnés — regrouper sous :
          </span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            {selectedAuthors.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name} ({a.count})
              </option>
            ))}
          </select>
          <Button onClick={handleMerge} disabled={merging} className="bg-amber-500 hover:bg-amber-600" size="sm">
            {merging ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Merge className="h-4 w-4 mr-1" />}
            Fusionner
          </Button>
        </div>
      )}
      {message && <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{message}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 p-6">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-500">Aucun auteur.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Auteur</th>
                  <th className="px-4 py-3">Livres</th>
                  <th className="px-4 py-3">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((a) => (
                  <tr
                    key={a.slug}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected.includes(a.slug) ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(a.slug)}
                        onChange={() => toggle(a.slug)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-900 dark:text-white">{a.name}</span>
                        <span className="text-xs text-slate-400">/{a.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.count}</td>
                    <td className="px-4 py-3">
                      {a.hasImage ? (
                        <span className="text-green-600 text-xs">📷 oui</span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
