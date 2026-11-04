"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";

interface Comment {
  id: string;
  name: string | null;
  content: string;
  createdAt: string;
}

export function PostComments({
  postId,
  isLoggedIn,
}: {
  postId: string;
  isLoggedIn: boolean;
}) {
  const { t } = useI18n();
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/commentaires?postId=${postId}`);
    if (res.ok) setComments((await res.json()).comments);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/commentaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content,
          ...(isLoggedIn ? {} : { name }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec");
      setContent("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white mb-4">
        <MessageSquare className="h-5 w-5 text-amber-500" />
        {t.comments.title} {comments.length > 0 && `(${comments.length})`}
      </h2>

      <Card className="mb-6">
        <CardContent className="p-5">
          <form onSubmit={submit} className="space-y-3">
            {!isLoggedIn && (
              <Input
                placeholder={t.comments.yourName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <textarea
              placeholder={t.comments.placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
              className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {submitting ? t.comments.sending : t.comments.publish}
            </Button>
          </form>
        </CardContent>
      </Card>

      {comments.length === 0 ? (
        <p className="text-slate-500 text-sm">{t.comments.empty}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="border-b border-slate-100 dark:border-slate-700 pb-4"
            >
              <div className="font-medium text-slate-900 dark:text-white mb-1">
                {c.name || t.comments.anonymous}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
