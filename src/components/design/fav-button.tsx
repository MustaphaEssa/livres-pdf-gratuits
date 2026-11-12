"use client";

import { useState } from "react";
import Icon, { I } from "./icon";
import { useAuth } from "@/components/auth/auth-modal";

/** Favori lié au compte (API /api/favoris), stylé à la charte. */
export default function FavButton({
  bookId,
  title,
  initialFavorited,
  isLoggedIn,
}: {
  bookId: string;
  title?: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}) {
  const { openAuth } = useAuth();
  const [fav, setFav] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const addFavorite = async () => {
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

  const toggle = () => {
    if (!isLoggedIn) {
      openAuth({
        reason: title
          ? `Connectez-vous pour enregistrer « ${title} » dans vos favoris.`
          : "Connectez-vous pour enregistrer ce livre dans vos favoris.",
        onSuccess: addFavorite,
      });
      return;
    }
    addFavorite();
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
