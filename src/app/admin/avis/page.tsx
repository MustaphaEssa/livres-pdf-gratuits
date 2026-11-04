"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Trash2, Check, X, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";

interface Review {
  id: string;
  name: string | null;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  book: { title: string; slug: string };
}

type Filter = "all" | "pending" | "approved";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/avis${qs}`);
      if (res.ok) setReviews((await res.json()).reviews);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const setApproval = async (id: string, isApproved: boolean) => {
    const res = await fetch(`/api/admin/avis/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    if (res.ok) {
      setReviews((prev) =>
        filter === "all"
          ? prev.map((r) => (r.id === id ? { ...r, isApproved } : r))
          : prev.filter((r) => r.id !== id)
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cet avis ?")) return;
    const res = await fetch(`/api/admin/avis/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "pending", label: "En attente" },
    { key: "approved", label: "Approuvés" },
  ];

  return (
    <AdminShell active="avis">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Modération des avis</h1>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm rounded-lg ${
              filter === f.key
                ? "bg-amber-500 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 p-6">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-slate-500">Aucun avis dans cette catégorie.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {r.name || "Anonyme"}
                      </span>
                      <span className="text-slate-400">sur</span>
                      <Link href={`/livre/${r.book.slug}`} className="text-amber-600 hover:underline">
                        {r.book.title}
                      </Link>
                      {r.isApproved ? (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded">
                          Approuvé
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded">
                          En attente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= r.rating ? "fill-amber-500 text-amber-500" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    {r.comment && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{r.comment}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.isApproved ? (
                      <button
                        onClick={() => setApproval(r.id, false)}
                        title="Masquer (mettre en attente)"
                        className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg text-yellow-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setApproval(r.id, true)}
                        title="Approuver"
                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-green-500"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      title="Supprimer"
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
