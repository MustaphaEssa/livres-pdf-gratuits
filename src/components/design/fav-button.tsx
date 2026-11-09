"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { I } from "./icon";

/** Favori lié au compte (API /api/favoris), stylé à la charte. */
export default function FavButton({
  bookId,
  slug,
  initialFavorited,
  isLoggedIn,
}: {
  bookId: string;
  slug: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/connexion?from=/livre/${slug}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/favoris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      if (res.ok) setFav((await res.json()).favorited);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-light btn-lg"
      aria-pressed={fav}
      disabled={loading}
      onClick={toggle}
    >
      <Icon d={I.bookmark} fill={fav ? "currentColor" : "none"} />
      {fav ? "Dans mes favoris" : "Ajouter aux favoris"}
    </button>
  );
}
