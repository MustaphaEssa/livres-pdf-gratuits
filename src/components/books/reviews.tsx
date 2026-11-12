"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

interface Review {
  id: string;
  name: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Liste d'étoiles (affichage seul), harmonisée à la charte. */
function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="star-row" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          width={size}
          height={size}
          className={s <= value ? "on" : ""}
          fill={s <= value ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
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
      {/* Formulaire */}
      <div className="review-form">
        {done ? (
          <p className="form-note ok">{t.reviews.thanks}</p>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="stars-input" role="radiogroup" aria-label={t.reviews.chooseRating}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={s <= (hover || rating) ? "on" : ""}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  role="radio"
                  aria-checked={rating === s}
                  aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
                >
                  <Star
                    width={26}
                    height={26}
                    fill={s <= (hover || rating) ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            {!isLoggedIn && (
              <input
                className="field"
                placeholder={t.reviews.yourName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <textarea
              className="field"
              placeholder={t.reviews.comment}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            {error && <p className="form-note err">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: "flex-start" }}>
              {submitting ? t.reviews.sending : t.reviews.publish}
            </button>
          </form>
        )}
      </div>

      {/* Liste */}
      {reviews.length === 0 ? (
        <p className="review-empty">{t.reviews.none}</p>
      ) : (
        <div className="review-list">
          {reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-head">
                <span className="who">{r.name || t.reviews.anonymous}</span>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
