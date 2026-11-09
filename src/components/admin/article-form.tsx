"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InitialPost {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  author?: string | null;
  coverImage?: string | null;
  categorySlug?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

interface Cat {
  slug: string;
  name: string;
  type: string;
}

export function ArticleForm({
  mode,
  initial = {},
}: {
  mode: "create" | "edit";
  initial?: InitialPost;
}) {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState({
    title: initial.title ?? "",
    slug: initial.slug ?? "",
    excerpt: initial.excerpt ?? "",
    content: initial.content ?? "",
    author: initial.author ?? "",
    coverImage: initial.coverImage ?? "",
    categorySlug: initial.categorySlug ?? "",
    isPublished: initial.isPublished ?? true,
    isFeatured: initial.isFeatured ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) =>
        setCats((d.categories || []).filter((c: Cat) => c.type === "BLOG"))
      )
      .catch(() => {});
  }, []);

  const up = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const uploadImage = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("name", form.slug || form.title || "couverture");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de l'upload");
      up({ coverImage: data.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/articles"
          : `/api/admin/articles/${initial.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec");
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/blog");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Article</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titre *</label>
            <Input value={form.title} onChange={(e) => up({ title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Slug {mode === "create" && "(auto si vide)"}
            </label>
            <Input value={form.slug} onChange={(e) => up({ slug: e.target.value })} placeholder="mon-article" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Extrait</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => up({ excerpt: e.target.value })}
              rows={2}
              className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contenu *</label>
            <textarea
              value={form.content}
              onChange={(e) => up({ content: e.target.value })}
              rows={10}
              required
              placeholder="Séparez les paragraphes par une ligne vide."
              className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Auteur</label>
              <Input value={form.author} onChange={(e) => up({ author: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select
                value={form.categorySlug}
                onChange={(e) => up({ categorySlug: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">— Aucune —</option>
                {cats.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Image de couverture (optionnel)
            </label>

            {form.coverImage ? (
              <div className="relative inline-block mb-3">
                <div className="relative w-56 aspect-video rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={form.coverImage}
                    alt="Aperçu de la couverture"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={() => up({ coverImage: "" })}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-1 shadow hover:bg-red-600"
                  title="Retirer l'image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Envoi…" : "Choisir une image"}
              </Button>
              <span className="text-xs text-slate-400">
                JPG, PNG ou WebP — 5 Mo max, idéal 1200×675
              </span>
            </div>

            <Input
              value={form.coverImage}
              onChange={(e) => up({ coverImage: e.target.value })}
              placeholder="…ou collez une URL https://…"
              className="mt-2"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => up({ isPublished: e.target.checked })} className="rounded border-slate-300" />
              Publié
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => up({ isFeatured: e.target.checked })} className="rounded border-slate-300" />
              À la une
            </label>
          </div>
        </CardContent>
      </Card>

      {error && <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">{error}</div>}
      {success && <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">Enregistré ! Redirection…</div>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600">
          {saving ? "Enregistrement…" : (<><Save className="h-4 w-4 mr-2" /> Enregistrer</>)}
        </Button>
        <Link href="/admin/blog"><Button variant="outline" type="button">Annuler</Button></Link>
      </div>
    </form>
  );
}
