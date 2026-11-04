"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleForm } from "@/components/admin/article-form";

export default function NewArticlePage() {
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
            Nouvel article
          </h1>
        </div>
      </header>
      <main className="p-6">
        <ArticleForm mode="create" />
      </main>
    </div>
  );
}
