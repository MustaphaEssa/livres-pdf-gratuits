"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, X, Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { AdminShell } from "@/components/admin/admin-shell";

interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  _count: { books: number; posts: number };
}

export default function AdminCategoriesPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire d'ajout
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("BOOK");
  const [adding, setAdding] = useState(false);

  // Édition en ligne
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, type: newType }),
    });
    if (res.ok) {
      setNewName("");
      await fetchCategories();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.addImpossible);
    }
    setAdding(false);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) {
      setEditId(null);
      await fetchCategories();
    }
  };

  const handleDelete = async (id: string, name: string, count: number) => {
    if (!window.confirm(`${t.admin.confirmDeleteCategory} « ${name} » ? (${count})`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <AdminShell active="categories">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          {t.admin.categoriesTitle}
        </h1>

        {/* Ajout */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t.admin.addCategoryTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1">{t.admin.cName}</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.admin.cNamePh} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.admin.cType}</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="BOOK">{t.admin.typeBooks}</option>
                  <option value="BLOG">{t.admin.typeBlog}</option>
                </select>
              </div>
              <Button type="submit" disabled={adding} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-1" /> {adding ? t.admin.adding : t.admin.add}
              </Button>
            </form>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Liste */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 p-6">
                <Loader2 className="h-5 w-5 animate-spin" /> {t.admin.loading}
              </div>
            ) : categories.length === 0 ? (
              <div className="p-6 text-slate-500">{t.admin.noCategories}</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t.admin.cName}</th>
                    <th className="px-4 py-3">{t.admin.colSlug}</th>
                    <th className="px-4 py-3">{t.admin.cType}</th>
                    <th className="px-4 py-3">{t.admin.colBooks}</th>
                    <th className="px-4 py-3 text-right">{t.admin.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        {editId === c.id ? (
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                        ) : (
                          <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded">
                          {c.type === "BLOG" ? t.admin.typeBlog : t.admin.typeBooks}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c._count.books}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {editId === c.id ? (
                            <>
                              <button onClick={() => saveEdit(c.id)} className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-green-500" title="Enregistrer">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" title="Annuler">
                                <X className="h-4 w-4 text-slate-400" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditId(c.id); setEditName(c.name); }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                title="Renommer"
                              >
                                <Edit className="h-4 w-4 text-slate-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id, c.name, c._count.books)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
