"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit, Trash2, Plus, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";
import { AdminShell } from "@/components/admin/admin-shell";

interface Post {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  categories: { category: { name: string; slug: string } }[];
}

export default function AdminBlogPage() {
  const { t } = useI18n();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/articles");
      if (res.ok) setPosts((await res.json()).posts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const togglePublish = async (p: Post) => {
    const res = await fetch(`/api/admin/articles/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !p.isPublished }),
    });
    if (res.ok) {
      const { post } = await res.json();
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...post } : x)));
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`${t.admin.confirmDeleteArticle} « ${title} » ?`)) return;
    const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <AdminShell active="blog">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.admin.articlesTitle}</h1>
            <Link href="/admin/blog/nouveau">
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-1" /> {t.admin.newArticle}
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500 p-6">
                  <Loader2 className="h-5 w-5 animate-spin" /> {t.admin.loading}
                </div>
              ) : posts.length === 0 ? (
                <div className="p-6 text-slate-500">
                  {t.admin.noArticles}{" "}
                  <Link href="/admin/blog/nouveau" className="text-amber-500 hover:underline">
                    {t.admin.createFirst}
                  </Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">{t.admin.colTitle}</th>
                      <th className="px-4 py-3">{t.admin.colCategory}</th>
                      <th className="px-4 py-3">{t.admin.colStatus}</th>
                      <th className="px-4 py-3 text-right">{t.admin.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {posts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{p.title}</div>
                          <div className="text-xs text-slate-500">{p.author}</div>
                        </td>
                        <td className="px-4 py-3">
                          {p.categories[0] && (
                            <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded">
                              {p.categories[0].category.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => togglePublish(p)}
                            className={`px-2 py-1 text-xs rounded hover:opacity-80 ${
                              p.isPublished
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            }`}
                          >
                            {p.isPublished ? t.admin.published : t.admin.draft}
                          </button>
                          {p.isFeatured && (
                            <span className="ml-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded">
                              {t.admin.atFront}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/blog/${p.slug}`} title="Voir">
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                <Eye className="h-4 w-4 text-slate-400" />
                              </button>
                            </Link>
                            <Link href={`/admin/blog/${p.id}/modifier`} title="Modifier">
                              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                <Edit className="h-4 w-4 text-slate-400" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(p.id, p.title)}
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
              )}
            </CardContent>
          </Card>
    </AdminShell>
  );
}
