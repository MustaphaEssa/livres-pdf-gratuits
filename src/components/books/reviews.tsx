"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

interface Review {
  id: string;
  name: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export function Reviews({
  bookId,
  isLoggedIn,
}: {
  bookId: string;
  isLoggedIn: boolean;
}) {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/avis?bookId=${bookId}`);
    if (res.ok) setReviews((await res.json()).reviews);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating < 1) {
      setError(t.reviews.chooseRating);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          rating,
          comment,
          ...(isLoggedIn ? {} : { name }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi");
      setDone(true);
      setRating(0);
      setComment("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
        {t.reviews.title} {reviews.length > 0 && `(${reviews.length})`}
      </h2>

      {/* Formulaire */}
      <Card className="mb-6">
        <CardContent className="p-5">
          {done ? (
            <p className="text-green-600 dark:text-green-400 text-sm">
              {t.reviews.thanks}
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        s <= (hover || rating)
                          ? "fill-amber-500 text-amber-500"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {!isLoggedIn && (
                <Input
                  placeholder={t.reviews.yourName}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <textarea
                placeholder={t.reviews.comment}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {submitting ? t.reviews.sending : t.reviews.publish}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Liste */}
      {reviews.length === 0 ? (
        <p className="text-slate-500 text-sm">{t.reviews.none}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="border-b border-slate-100 dark:border-slate-700 pb-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900 dark:text-white">
                  {r.name || t.reviews.anonymous}
                </span>
                <span className="flex items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= r.rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  ))}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
