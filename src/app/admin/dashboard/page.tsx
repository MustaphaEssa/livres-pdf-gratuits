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
  TrendingUp,
  TrendingDown,
  Globe,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";
import { DownloadsChart, type SeriesPoint } from "@/components/admin/downloads-chart";
import { formatAuthorName } from "@/lib/utils";

interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  isPublished: boolean;
}

interface TopBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  count: number;
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
  books: number;
  users: number;
  posts: number;
  downloadsTotal: number;
  pendingReviews: number;
  recentReviews: RecentReview[];
  recentBooks: Book[];
  days: number;
  downloadsSeries: SeriesPoint[];
  period: { total: number; web: number; app: number; previousTotal: number };
  topBooks: TopBook[];
}

const PERIODS = [
  { days: 7, label: "7 j" },
  { days: 30, label: "30 j" },
  { days: 90, label: "90 j" },
  { days: 365, label: "1 an" },
];

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRefreshing(true);
    fetch(`/api/admin/stats?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch((error) => console.error("Erreur de chargement du dashboard :", error))
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const books = stats?.recentBooks ?? [];
  const p = stats?.period;
  const change =
    p && p.previousTotal > 0 ? Math.round(((p.total - p.previousTotal) / p.previousTotal) * 100) : null;
  const appShare = p && p.total > 0 ? Math.round((p.app / p.total) * 100) : 0;

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
              {stats ? stats.books.toLocaleString() : "..."}
            </div>
            <div className="text-sm text-slate-500">{t.admin.totalBooks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="p-3 bg-[#e8ebf3] dark:bg-[#14213d]/20 rounded-lg w-fit mb-4">
              <Download className="h-6 w-6 text-[#14213d] dark:text-sky-300" />
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

      {/* Graphique des téléchargements + top de la période */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Téléchargements</CardTitle>
              {p && (
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {p.total.toLocaleString("fr-FR")}
                  </span>
                  {change !== null && (
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${
                        change >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                      title={`Période précédente : ${p.previousTotal.toLocaleString("fr-FR")}`}
                    >
                      {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {change >= 0 ? "+" : ""}
                      {change} % vs période précédente
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1" role="group" aria-label="Période">
              {PERIODS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setDays(opt.days)}
                  aria-pressed={days === opt.days}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    days === opt.days
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-medium"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className={`transition-opacity ${refreshing && stats ? "opacity-60" : ""}`}>
            {!stats ? (
              <div className="text-center py-20 text-slate-500">{t.admin.loading}</div>
            ) : (
              <>
                <DownloadsChart series={stats.downloadsSeries} />
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <Globe className="h-5 w-5 text-[#14213d] dark:text-sky-300" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {stats.period.web.toLocaleString("fr-FR")}
                      </div>
                      <div className="text-xs text-slate-500">
                        Site web{stats.period.total > 0 ? ` · ${100 - appShare} %` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <Smartphone className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {stats.period.app.toLocaleString("fr-FR")}
                      </div>
                      <div className="text-xs text-slate-500">
                        App Android{stats.period.total > 0 ? ` · ${appShare} %` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Les plus téléchargés</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <div className="text-center py-8 text-slate-500">{t.admin.loading}</div>
            ) : stats.topBooks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Aucun téléchargement sur cette période</div>
            ) : (
              <ol className="space-y-3">
                {stats.topBooks.map((b, i) => (
                  <li key={b.id}>
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="w-4 text-slate-400 tabular-nums">{i + 1}</span>
                      <Link
                        href={`/livre/${b.slug}`}
                        className="flex-1 min-w-0 truncate font-medium text-slate-900 dark:text-white hover:underline"
                        title={`${b.title} — ${formatAuthorName(b.author)}`}
                      >
                        {b.title}
                      </Link>
                      <span className="tabular-nums text-slate-600 dark:text-slate-300">
                        {b.count.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div className="ml-6 mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${(b.count / stats.topBooks[0].count) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

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
              {!stats ? (
                <div className="text-center py-4 text-slate-500">{t.admin.loading}</div>
              ) : books.length === 0 ? (
                <div className="text-center py-4 text-slate-500">{t.admin.noBooks}</div>
              ) : (
                books.map((book) => (
                  <div key={book.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white truncate">{book.title}</h4>
                        <p className="text-sm text-slate-500 truncate">{formatAuthorName(book.author)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-1 text-xs rounded ${
                        book.isPublished
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}>
                        {book.isPublished ? t.admin.published : t.admin.draft}
                      </span>
                      <Link
                        href={`/livre/${book.slug}`}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title={t.admin.view}
                      >
                        <Eye className="h-4 w-4 text-slate-400" />
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
