"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FavoriteButtonProps {
  bookId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  addLabel: string;
  removeLabel: string;
}

export function FavoriteButton({
  bookId,
  initialFavorited,
  isLoggedIn,
  addLabel,
  removeLabel,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isLoggedIn) {
      router.push("/auth/connexion?from=/");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/favoris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="flex-1"
      onClick={toggle}
      disabled={loading}
      title={favorited ? removeLabel : addLabel}
      aria-pressed={favorited}
    >
      <Heart
        className={`h-5 w-5 ${favorited ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
