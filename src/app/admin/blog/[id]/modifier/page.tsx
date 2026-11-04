"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleForm } from "@/components/admin/article-form";

export default function EditArticlePage() {
  const id = useParams().id as string;
  const [initial, setInitial] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.post) {
          const p = d.post;
          setInitial({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            content: p.content,
            author: p.author,
            coverImage: p.coverImage,
            categorySlug: p.categories?.[0]?.category?.slug ?? "",
            isPublished: p.isPublished,
            isFeatured: p.isFeatured,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Modifier l'article
          </h1>
        </div>
      </header>
      <main className="p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
          </div>
        ) : initial ? (
          <ArticleForm mode="edit" initial={initial} />
        ) : (
          <p className="text-red-500">Article introuvable.</p>
        )}
      </main>
    </div>
  );
}
