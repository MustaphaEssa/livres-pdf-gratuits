"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatAuthorName } from "@/lib/utils";

interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  categories: { category: { name: string; slug: string } }[];
  language: string;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminBooksPage() {
  const { t } = useI18n();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState("Tous");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch("/api/livres");
        setBooks(await response.json());
      } catch (error) {
        console.error("Erreur de chargement des livres :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Catégories réelles dérivées des livres (plus de liste codée en dur)
  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    books.forEach((b) => b.categories.forEach((c) => names.add(c.category.name)));
    return ["Tous", ...Array.from(names).sort()];
  }, [books]);

  const patchBook = async (id: string, data: Partial<Book>) => {
    const res = await fetch(`/api/admin/livres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { book } = await res.json();
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...book } : b)));
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`${t.admin.confirmDeleteBook}\n\n« ${title} »`)) return;
    const res = await fetch(`/api/admin/livres/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } else {
      window.alert("La suppression a échoué.");
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tous" ||
      book.categories.some((cat) => cat.category.name === selectedCategory);
    const matchesStatus =
      selectedStatus === "Tous" ||
      (selectedStatus === "published" && book.isPublished) ||
      (selectedStatus === "draft" && !book.isPublished);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AdminShell active="livres">
      {/* Titre */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.admin.booksTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {books.length} {t.admin.booksWord}
          </p>
        </div>
        <Link href="/admin/livres/ajouter">
          <Button className="bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4 mr-2" />
            {t.admin.addBook}
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t.admin.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "Tous" ? t.admin.allCategories : cat}
                </option>
              ))}
            </select>
            <select
              className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="Tous">Tous les statuts</option>
              <option value="published">{t.admin.published}</option>
              <option value="draft">{t.admin.draft}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des livres */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">{t.admin.loading}</div>
          ) : filteredBooks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">{t.admin.noBooks}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t.admin.colTitle}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t.admin.colCategory}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t.admin.colStatus}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t.admin.colDownloads}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">{t.admin.colRating}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-400">{t.admin.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-white">{book.title}</h4>
                            <p className="text-sm text-slate-500">{formatAuthorName(book.author)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {book.categories.map((cat) => (
                            <span key={cat.category.slug} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded">
                              {cat.category.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => patchBook(book.id, { isPublished: !book.isPublished })}
                          title="Cliquer pour basculer"
                          className={`px-2 py-1 text-xs rounded transition-opacity hover:opacity-80 ${
                            book.isPublished
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          }`}
                        >
                          {book.isPublished ? t.admin.published : t.admin.draft}
                        </button>
                        <button
                          onClick={() => patchBook(book.id, { isFeatured: !book.isFeatured })}
                          title="Cliquer pour basculer la mise en vedette"
                          className={`ml-1 px-2 py-1 text-xs rounded transition-opacity hover:opacity-80 ${
                            book.isFeatured
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-slate-100 text-slate-400 dark:bg-slate-700"
                          }`}
                        >
                          {t.admin.featured}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {book.downloadCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {book.rating} ({book.ratingCount})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/livre/${book.slug}`} title={t.admin.view}>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                              <Eye className="h-4 w-4 text-slate-400" />
                            </button>
                          </Link>
                          <Link href={`/admin/livres/${book.id}/modifier`} title={t.admin.edit}>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                              <Edit className="h-4 w-4 text-slate-400" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(book.id, book.title)}
                            title={t.admin.delete}
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

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500">
              {t.admin.showing} {filteredBooks.length} {t.admin.onWord} {books.length} {t.admin.booksWord}
            </p>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
