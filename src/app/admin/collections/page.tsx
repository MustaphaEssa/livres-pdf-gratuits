"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Library, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";

interface CollectionRow {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  _count: { books: number };
}

export default function AdminCollectionsPage() {
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/collections");
      if (r.ok) setRows((await r.json()).collections);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string, title: string) => {
    if (!confirm(`Supprimer la collection « ${title} » ?`)) return;
    const r = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    if (r.ok) setRows((rs) => rs.filter((x) => x.id !== id));
  };

  return (
    <AdminShell active="collections">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Collections</h1>
        <Link href="/admin/collections/nouveau">
          <Button className="bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4 mr-2" /> Nouvelle collection
          </Button>
        </Link>
      </div>

      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Des listes thématiques de livres (« À lire en un week-end », « Classiques
        d&apos;aventure »…) pour guider les visiteurs et renforcer le référencement.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Library className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Aucune collection pour l&apos;instant.</p>
            <Link href="/admin/collections/nouveau">
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-2" /> Créer la première
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {c.title}
                  </span>
                  {!c.isPublished && (
                    <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500">
                      Brouillon
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  /{c.slug} · {c._count.books} livre(s)
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/collections/${c.id}/modifier`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => remove(c.id, c.title)}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
