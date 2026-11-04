"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  BookOpen,
  Users,
  Download,
  FileText,
  Plus,
  Eye,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";

interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  downloadCount: number;
  rating: number;
  isPublished: boolean;
  createdAt: string;
}

interface RecentReview {
  id: string;
  bookTitle: string;
  bookSlug: string;
  name: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

interface Stats {
  users: number;
  posts: number;
  downloadsTotal: number;
  pendingReviews: number;
  recentReviews: RecentReview[];
  downloadsSeries: { date: string; count: number }[];
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [booksRes, statsRes] = await Promise.all([
          fetch("/api/livres"),
          fetch("/api/admin/stats"),
        ]);
        if (booksRes.ok) setBooks(await booksRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (error) {
        console.error("Erreur de chargement du dashboard :", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxDownload = Math.max(1, ...(stats?.downloadsSeries.map((d) => d.count) ?? [0]));

  return (
    <AdminShell active="dashboard">
      {/* Titre */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.admin.dashboard}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Bienvenue dans votre espace d&apos;administration
          </p>
        </div>
        <Link href="/admin/livres/ajouter">
          <Button className="bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un livre
          </Button>
        </Link>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg w-fit mb-4">
              <BookOpen className="h-6 w-6 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {loading ? "..." : books.length}
            </div>
            <div className="text-sm text-slate-500">{t.admin.totalBooks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit mb-4">
              <Download className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {stats ? stats.downloadsTotal.toLocaleString() : "..."}
            </div>
            <div className="text-sm text-slate-500">{t.admin.downloads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {stats ? stats.users.toLocaleString() : "..."}
            </div>
            <div className="text-sm text-slate-500">{t.admin.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-fit mb-4">
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {stats ? stats.posts.toLocaleString() : "..."}
            </div>
            <div className="text-sm text-slate-500">{t.admin.blogPosts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des téléchargements (14 jours) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Téléchargements (14 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <div className="text-center py-8 text-slate-500">{t.admin.loading}</div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {stats.downloadsSeries.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                  <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                  <div
                    className="w-full bg-amber-500/80 hover:bg-amber-500 rounded-t transition-all"
                    style={{ height: `${(d.count / maxDownload) * 100}%`, minHeight: d.count > 0 ? "4px" : "2px" }}
                    title={`${d.date} : ${d.count}`}
                  />
                  <span className="text-[10px] text-slate-400">{d.date.slice(8, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Livres récents & avis récents */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Livres récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t.admin.recentBooks}</CardTitle>
            <Link href="/admin/livres">
              <Button variant="ghost" size="sm">{t.admin.seeAll}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-slate-500">{t.admin.loading}</div>
              ) : books.length === 0 ? (
                <div className="text-center py-4 text-slate-500">{t.admin.noBooks}</div>
              ) : (
                books.slice(0, 5).map((book) => (
                  <div key={book.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{book.title}</h4>
                        <p className="text-sm text-slate-500">{book.author}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        book.isPublished
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}>
                        {book.isPublished ? t.admin.published : t.admin.draft}
                      </span>
                      <Link href={`/livre/${book.slug}`}>
                        <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                          <Eye className="h-4 w-4 text-slate-400" />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avis récents (réels) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Avis récents</CardTitle>
            <Link href="/admin/avis">
              <Button variant="ghost" size="sm">{t.admin.seeAll}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats ? (
                <div className="text-center py-4 text-slate-500">{t.admin.loading}</div>
              ) : stats.recentReviews.length === 0 ? (
                <div className="text-center py-4 text-slate-500">Aucun avis pour le moment</div>
              ) : (
                stats.recentReviews.map((review) => (
                  <div key={review.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{review.bookTitle}</h4>
                        <p className="text-sm text-slate-500">{review.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "fill-amber-500 text-amber-500" : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/livres/ajouter">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span className="text-sm">Ajouter un livre</span>
              </Button>
            </Link>
            <Link href="/admin/blog/nouveau">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm">Nouvel article</span>
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="text-sm">Catégories</span>
              </Button>
            </Link>
            <Link href="/admin/parametres">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Star className="h-5 w-5" />
                <span className="text-sm">Paramètres</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
