"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Search, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookLite {
  id: string;
  title: string;
  author: string;
  coverImage?: string | null;
}

interface SelectedBook extends BookLite {
  note: string;
}

interface InitialCollection {
  id?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  coverImage?: string | null;
  isPublished?: boolean;
  books?: { note?: string | null; book: BookLite }[];
}

export function CollectionForm({
  mode,
  initial = {},
}: {
  mode: "create" | "edit";
  initial?: InitialCollection;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial.title ?? "",
    slug: initial.slug ?? "",
    description: initial.description ?? "",
    coverImage: initial.coverImage ?? "",
    isPublished: initial.isPublished ?? true,
  });
  const [selected, setSelected] = useState<SelectedBook[]>(
    (initial.books ?? []).map((b) => ({ ...b.book, note: b.note ?? "" }))
  );
  const [allBooks, setAllBooks] = useState<BookLite[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/livres")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: BookLite[]) => setAllBooks(d))
      .catch(() => {});
  }, []);

  const up = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allBooks
      .filter(
        (b) =>
          !selectedIds.has(b.id) &&
          (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, allBooks, selectedIds]);

  const addBook = (b: BookLite) => {
    setSelected((s) => [...s, { ...b, note: "" }]);
    setQuery("");
  };
  const removeBook = (id: string) => setSelected((s) => s.filter((x) => x.id !== id));
  const setNote = (id: string, note: string) =>
    setSelected((s) => s.map((x) => (x.id === id ? { ...x, note } : x)));
  const move = (i: number, dir: -1 | 1) => {
    setSelected((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        books: selected.map((s) => ({ bookId: s.id, note: s.note || null })),
      };
      const url =
        mode === "create"
          ? "/api/admin/collections"
          : `/api/admin/collections/${initial.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec");
      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titre *</label>
            <Input
              value={form.title}
              onChange={(e) => up({ title: e.target.value })}
              placeholder="ex. À lire en un week-end"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Slug {mode === "create" && "(auto si vide)"}
            </label>
            <Input
              value={form.slug}
              onChange={(e) => up({ slug: e.target.value })}
              placeholder="a-lire-en-un-week-end"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => up({ description: e.target.value })}
              rows={3}
              placeholder="Un mot sur l'idée de cette collection."
              className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Image de couverture (URL, optionnel)
            </label>
            <Input
              value={form.coverImage}
              onChange={(e) => up({ coverImage: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => up({ isPublished: e.target.checked })}
              className="rounded border-slate-300"
            />
            Publiée
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Livres de la collection ({selected.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche + ajout */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un livre à ajouter…"
              className="pl-9"
            />
            {results.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg max-h-72 overflow-y-auto">
                {results.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => addBook(b)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Plus className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="truncate">
                      {b.title}{" "}
                      <span className="text-slate-400">— {b.author}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Livres sélectionnés */}
          {selected.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun livre. Recherchez-en un ci-dessus.</p>
          ) : (
            <ul className="space-y-3">
              {selected.map((b, i) => (
                <li
                  key={b.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {i + 1}. {b.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{b.author}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="px-1.5 text-slate-400 hover:text-amber-500 disabled:opacity-30"
                        title="Monter"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === selected.length - 1}
                        className="px-1.5 text-slate-400 hover:text-amber-500 disabled:opacity-30"
                        title="Descendre"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBook(b.id)}
                        className="px-1.5 text-red-400 hover:text-red-600"
                        title="Retirer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Input
                    value={b.note}
                    onChange={(e) => setNote(b.id, e.target.value)}
                    placeholder="Note : pourquoi ce livre ? (optionnel)"
                    className="text-sm"
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600">
          {saving ? "Enregistrement…" : (<><Save className="h-4 w-4 mr-2" /> Enregistrer</>)}
        </Button>
        <Link href="/admin/collections">
          <Button variant="outline" type="button">Annuler</Button>
        </Link>
      </div>
    </form>
  );
}
