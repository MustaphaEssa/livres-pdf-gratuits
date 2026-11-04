"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Heart, Download, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  _count: { favorites: number; downloads: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/utilisateurs");
      if (res.ok) setUsers((await res.json()).users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (u: User) => {
    const res = await fetch(`/api/admin/utilisateurs/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) {
      const { user } = await res.json();
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...user } : x)));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer définitivement le compte « ${name} » ?`)) return;
    const res = await fetch(`/api/admin/utilisateurs/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminShell active="utilisateurs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Utilisateurs</h1>
          <p className="text-slate-600 dark:text-slate-400">{users.length} compte(s)</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom ou email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 p-6">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-500">Aucun utilisateur.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Activité</th>
                    <th className="px-4 py-3">Inscrit le</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-slate-500">
                          <span className="flex items-center gap-1" title="Favoris">
                            <Heart className="h-4 w-4" /> {u._count.favorites}
                          </span>
                          <span className="flex items-center gap-1" title="Téléchargements">
                            <Download className="h-4 w-4" /> {u._count.downloads}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(u)}
                          title="Cliquer pour basculer"
                          className={`px-2 py-1 text-xs rounded hover:opacity-80 ${
                            u.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                          }`}
                        >
                          {u.isActive ? "Actif" : "Désactivé"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            title="Supprimer"
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
