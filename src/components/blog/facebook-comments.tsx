"use client";

import { useEffect } from "react";
import { MessageCircle } from "lucide-react";

// Déclare FB sur window pour TypeScript
declare global {
  interface Window {
    FB?: { XFBML?: { parse: () => void } };
  }
}

/**
 * Plugin officiel « Facebook Comments ».
 * Les commentaires sont rattachés à l'URL canonique de l'article et
 * publiés par de vrais visiteurs connectés à leur compte Facebook.
 *
 * Nécessite un identifiant d'application Facebook défini dans
 * NEXT_PUBLIC_FACEBOOK_APP_ID (voir .env.example).
 */
export function FacebookComments({ url }: { url: string }) {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  useEffect(() => {
    // Sans App ID, on ne charge pas le SDK Facebook.
    if (!appId) return;
    // Si le SDK est déjà chargé, on demande juste un nouveau rendu du widget.
    if (window.FB?.XFBML) {
      window.FB.XFBML.parse();
      return;
    }
    if (document.getElementById("facebook-jssdk")) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src =
      "https://connect.facebook.net/fr_FR/sdk.js#xfbml=1&version=v21.0" +
      (appId ? `&appId=${appId}` : "");
    document.body.appendChild(script);
  }, [url, appId]);

  // Sans App ID, le plugin ne peut pas fonctionner : on n'affiche rien.
  if (!appId) return null;

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white mb-4">
        <MessageCircle className="h-5 w-5 text-[#1877F2]" />
        Rejoignez la discussion
      </h2>
      <div id="fb-root" />
      <div
        className="fb-comments"
        data-href={url}
        data-width="100%"
        data-numposts="10"
        data-order-by="reverse_time"
      />
    </div>
  );
}
