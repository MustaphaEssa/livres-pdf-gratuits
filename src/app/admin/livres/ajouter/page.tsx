"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminLogout } from "@/lib/admin-client";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  Upload,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

interface CategoryOption {
  name: string;
  slug: string;
}

export default function AddBookPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    slug: "",
    description: "",
    language: "fr",
    publishedYear: new Date().getFullYear(),
    isbn: "",
    publisher: "",
    pageCount: 0,
    rating: 0,
    isFeatured: false,
    isPublished: true,
    categorySlug: "",
  });

  useEffect(() => {
    // Accès protégé côté serveur par le middleware (cookie de session).
    setIsAuthenticated(true);
  }, []);

  // Charge les vraies catégories de livres depuis la base
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) return;
        const data = await res.json();
        const bookCats: CategoryOption[] = (data.categories ?? [])
          .filter((c: { type: string }) => c.type === "BOOK")
          .map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug }));
        setCategories(bookCats);
        // Sélectionne la première catégorie par défaut
        setFormData((prev) =>
          prev.categorySlug || bookCats.length === 0
            ? prev
            : { ...prev, categorySlug: bookCats[0].slug }
        );
      } catch {
        /* non bloquant */
      }
    })();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: prev.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      }));
    }
  }, [formData.title]);

  const handleLogout = async () => {
    await adminLogout();
    router.push("/admin/login");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!pdfFile) {
      setError(t.admin.selectPdf);
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append("title", formData.title);
      body.append("author", formData.author);
      body.append("slug", formData.slug);
      body.append("description", formData.description);
      body.append("language", formData.language);
      body.append("publishedYear", String(formData.publishedYear));
      body.append("isbn", formData.isbn);
      body.append("publisher", formData.publisher);
      body.append("pageCount", String(formData.pageCount || ""));
      body.append("rating", String(formData.rating));
      body.append("isFeatured", String(formData.isFeatured));
      body.append("isPublished", String(formData.isPublished));
      body.append("categorySlug", formData.categorySlug);
      body.append("pdf", pdfFile);
      if (coverFile) body.append("cover", coverFile);

      // Pas d'en-tête Content-Type: le navigateur ajoute la frontière multipart
      const response = await fetch("/api/admin/livres", {
        method: "POST",
        body,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t.admin.errorGeneric);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/livres");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Error adding book:", err);
      setError(err instanceof Error ? err.message : t.admin.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-amber-500" />
                <span className="text-xl font-bold">Admin</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="space-y-2">
              <Link 
                href="/admin/dashboard" 
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                <BookOpen className="h-5 w-5" />
                Dashboard
              </Link>
              <Link 
                href="/admin/livres" 
                className="flex items-center gap-3 px-4 py-3 bg-amber-500 text-white rounded-lg"
              >
                <BookOpen className="h-5 w-5" />
                Livres
              </Link>
              <Link 
                href="/admin/categories" 
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                <Filter className="h-5 w-5" />
                Catégories
              </Link>
              <Link 
                href="/admin/blog" 
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                <BookOpen className="h-5 w-5" />
                Blog
              </Link>
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-4">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-amber-500" />
          <span className="text-xl font-bold">Admin</span>
        </div>
        <nav className="space-y-2">
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <BookOpen className="h-5 w-5" />
            Dashboard
          </Link>
          <Link 
            href="/admin/livres" 
            className="flex items-center gap-3 px-4 py-3 bg-amber-500 text-white rounded-lg"
          >
            <BookOpen className="h-5 w-5" />
            Livres
          </Link>
          <Link 
            href="/admin/categories" 
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <Filter className="h-5 w-5" />
            Catégories
          </Link>
          <Link 
            href="/admin/blog" 
            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg"
          >
            <BookOpen className="h-5 w-5" />
            Blog
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <Link href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-amber-500">
                {t.admin.viewSite}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.admin.logout}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Page Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/livres">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t.admin.addBookTitle}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {t.admin.addBookSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.admin.mainInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fTitle} *
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={t.admin.fTitlePh}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fSlug} *
                      </label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="slug-du-livre"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {t.admin.urlPrefix}: /livre/{formData.slug || "slug"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fAuthor} *
                      </label>
                      <Input
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder={t.admin.fAuthorPh}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fDescription}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t.admin.fDescriptionPh}
                        rows={4}
                        className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.admin.fLanguage}
                        </label>
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                        >
                          <option value="fr">Français</option>
                          <option value="ar">العربية</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.admin.fPubYear}
                        </label>
                        <Input
                          type="number"
                          value={formData.publishedYear}
                          onChange={(e) => setFormData({ ...formData, publishedYear: parseInt(e.target.value) })}
                          min={1900}
                          max={2100}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.admin.fIsbn}
                        </label>
                        <Input
                          value={formData.isbn}
                          onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                          placeholder="978-..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {t.admin.fPublisher}
                        </label>
                        <Input
                          value={formData.publisher}
                          onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                          placeholder={t.admin.fPublisherPh}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fPageCountOpt}
                      </label>
                      <Input
                        type="number"
                        value={formData.pageCount || ""}
                        onChange={(e) => setFormData({ ...formData, pageCount: parseInt(e.target.value) || 0 })}
                        min={1}
                        placeholder={t.admin.fPageCountPh}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Fichiers */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.admin.filesTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* PDF */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fPdf} *
                      </label>
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 cursor-pointer hover:border-amber-500 transition-colors">
                        <Upload className="h-8 w-8 text-slate-400" />
                        {pdfFile ? (
                          <span className="text-sm text-slate-900 dark:text-white text-center break-all">
                            {pdfFile.name}{" "}
                            <span className="text-slate-500">
                              ({(pdfFile.size / 1024 / 1024).toFixed(2)} Mo)
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">
                            {t.admin.choosePdf}
                          </span>
                        )}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>

                    {/* Couverture */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fCover}
                      </label>
                      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 cursor-pointer hover:border-amber-500 transition-colors">
                        <Upload className="h-6 w-6 text-slate-400" />
                        <span className="text-sm text-slate-500 text-center break-all">
                          {coverFile ? coverFile.name : t.admin.coverFormats}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.admin.settings}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.fCategory}
                      </label>
                      <select
                        value={formData.categorySlug}
                        onChange={(e) => setFormData({ ...formData, categorySlug: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                      >
                        {categories.length === 0 ? (
                          <option value="">Aucune catégorie — créez-en une d&apos;abord</option>
                        ) : (
                          categories.map((cat) => (
                            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <label htmlFor="isPublished" className="text-sm text-slate-700 dark:text-slate-300">
                        {t.admin.publishedCheck}
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <label htmlFor="isFeatured" className="text-sm text-slate-700 dark:text-slate-300">
                        {t.admin.featuredCheck}
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Error/Success Messages */}
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 text-sm text-green-500 bg-green-50 dark:bg-green-900/20 rounded-md">
                    {t.admin.bookCreated}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                    disabled={loading}
                  >
                    {loading ? (
                      t.admin.saving
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {t.admin.save}
                      </>
                    )}
                  </Button>
                  <Link href="/admin/livres">
                    <Button variant="outline" type="button">
                      {t.admin.cancel}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
