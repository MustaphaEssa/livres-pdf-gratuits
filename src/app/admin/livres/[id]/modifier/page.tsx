"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Save, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

interface CategoryOption {
  name: string;
  slug: string;
}

interface FormState {
  title: string;
  slug: string;
  author: string;
  description: string;
  language: string;
  publishedYear: number | "";
  isbn: string;
  publisher: string;
  pageCount: number | "";
  categorySlug: string;
  isPublished: boolean;
  isFeatured: boolean;
  coverImage: string | null;
}

export default function EditBookPage() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState<FormState | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/livres/${id}`);
        if (!res.ok) throw new Error("Livre introuvable");
        const { book } = await res.json();
        setForm({
          title: book.title ?? "",
          slug: book.slug ?? "",
          author: book.author ?? "",
          description: book.description ?? "",
          language: book.language ?? "fr",
          publishedYear: book.publishedYear ?? "",
          isbn: book.isbn ?? "",
          publisher: book.publisher ?? "",
          pageCount: book.pageCount ?? "",
          categorySlug: book.categories?.[0]?.category?.slug ?? "",
          isPublished: book.isPublished,
          isFeatured: book.isFeatured,
          coverImage: book.coverImage ?? null,
        });
      } catch {
        setError(t.admin.bookNotFound);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Charge les vraies catégories de livres depuis la base
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) return;
        const data = await res.json();
        setCategories(
          (data.categories ?? [])
            .filter((c: { type: string }) => c.type === "BOOK")
            .map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug }))
        );
      } catch {
        /* non bloquant */
      }
    })();
  }, []);

  const update = (patch: Partial<FormState>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      let res: Response;
      if (coverFile) {
        // Envoi multipart (nouvelle couverture + métadonnées)
        const body = new FormData();
        body.append("title", form.title);
        body.append("slug", form.slug);
        body.append("author", form.author);
        body.append("description", form.description);
        body.append("language", form.language);
        body.append("publishedYear", String(form.publishedYear || ""));
        body.append("pageCount", String(form.pageCount || ""));
        body.append("isbn", form.isbn);
        body.append("publisher", form.publisher);
        body.append("categorySlug", form.categorySlug);
        body.append("isPublished", String(form.isPublished));
        body.append("isFeatured", String(form.isFeatured));
        body.append("cover", coverFile);
        res = await fetch(`/api/admin/livres/${id}`, { method: "PATCH", body });
      } else {
        // Envoi JSON (métadonnées seules)
        const { coverImage: _coverImage, ...rest } = form;
        res = await fetch(`/api/admin/livres/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...rest,
            publishedYear: form.publishedYear || null,
            pageCount: form.pageCount || null,
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.admin.errorGeneric);
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/livres");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/livres">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" /> {t.admin.cancel}
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.admin.editBookTitle}
          </h1>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> {t.admin.editLoading}
          </div>
        ) : !form ? (
          <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
            {error || t.admin.bookNotFound}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.admin.mainInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.admin.fTitle} *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => update({ title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.admin.fSlug} *</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => update({ slug: e.target.value })}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {t.admin.urlPrefix} : /livre/{form.slug || "slug"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.admin.fAuthor} *</label>
                  <Input
                    value={form.author}
                    onChange={(e) => update({ author: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.admin.fDescription}</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    rows={4}
                    className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.admin.fLanguage}</label>
                    <select
                      value={form.language}
                      onChange={(e) => update({ language: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.admin.fCategory}</label>
                    <select
                      value={form.categorySlug}
                      onChange={(e) => update({ categorySlug: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    >
                      <option value="">{t.admin.afNone}</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.admin.fPubYear}</label>
                    <Input
                      type="number"
                      value={form.publishedYear}
                      onChange={(e) =>
                        update({ publishedYear: parseInt(e.target.value) || "" })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.bookPage.pages}</label>
                    <Input
                      type="number"
                      value={form.pageCount}
                      onChange={(e) =>
                        update({ pageCount: parseInt(e.target.value) || "" })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.admin.fIsbn}</label>
                    <Input
                      value={form.isbn}
                      onChange={(e) => update({ isbn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.admin.fPublisher}</label>
                    <Input
                      value={form.publisher}
                      onChange={(e) => update({ publisher: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => update({ isPublished: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    {t.admin.publishedCheck}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => update({ isFeatured: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    En vedette
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Couverture */}
            <Card>
              <CardHeader>
                <CardTitle>{t.admin.fCover}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  {/* Aperçu de la couverture actuelle */}
                  <div className="relative w-28 h-40 shrink-0 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {coverFile ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(coverFile)}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                    ) : form.coverImage ? (
                      <Image src={form.coverImage} alt={form.title} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-slate-400 text-center px-2">
                        Aucune couverture
                      </div>
                    )}
                  </div>

                  {/* Upload */}
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 cursor-pointer hover:border-amber-500 transition-colors">
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
                    {coverFile && (
                      <button
                        type="button"
                        onClick={() => setCoverFile(null)}
                        className="text-xs text-slate-500 hover:text-red-500 mt-2"
                      >
                        Annuler le nouveau fichier
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
                Modifications enregistrées ! Redirection…
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? (
                  "Enregistrement…"
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Enregistrer
                  </>
                )}
              </Button>
              <Link href="/admin/livres">
                <Button variant="outline" type="button">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
