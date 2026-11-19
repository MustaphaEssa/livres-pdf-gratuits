import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  isLocale,
  localeFromAcceptLanguage,
  localizePath,
  stripLocale,
  type Locale,
} from "@/i18n/config";

// 1) /admin/* : protégé par session (sauf la page de connexion).
// 2) Pages publiques : la langue vient du préfixe d'URL.
//    /en/catalogue  → réécrit en /catalogue avec l'en-tête x-locale: en
//    /fr/catalogue  → redirigé (308) vers /catalogue (le français n'a pas de préfixe)
//    /catalogue     → x-locale: fr
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // www.livrespdfgratuits.com → livrespdfgratuits.com (301) : une seule adresse
  // pour Google, sinon chaque page existe en double (www et sans www).
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").toLowerCase();
  if (host.startsWith("www.")) {
    const target = `https://${host.slice(4)}${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(target, 301);
  }

  if (pathname.startsWith("/admin")) return adminGuard(request);

  const seg = pathname.split("/")[1] ?? "";
  if (isLocale(seg)) {
    const rest = pathname.slice(seg.length + 1) || "/";
    // /fr/… et /xx/admin… (jamais localisé : l'admin doit repasser par son garde)
    if (seg === DEFAULT_LOCALE || /^\/(admin|api|uploads)(\/|$)/.test(rest)) {
      const url = request.nextUrl.clone();
      url.pathname = rest;
      return NextResponse.redirect(url, 308);
    }
    // Segments traduits → route interne (/en/book/x → /livre/x)
    const internal = stripLocale(pathname);
    // Adresse non officielle (ex. /en/livre/x avec des segments français) → forme canonique
    const canonical = localizePath(seg, internal);
    if (canonical !== pathname && request.method === "GET" && !/\/pdf$/.test(internal)) {
      const url = request.nextUrl.clone();
      url.pathname = canonical;
      return NextResponse.redirect(url, 308);
    }
    const url = request.nextUrl.clone();
    url.pathname = internal;
    return withLocale(request, seg, url);
  }

  // Adresse sans préfixe (français) : on oriente le visiteur vers sa langue.
  const target = preferredLocale(request);
  if (target !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(target as Locale, pathname);
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Vary", "Accept-Language, Cookie");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  return withLocale(request, DEFAULT_LOCALE);
}

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse/i;

/**
 * Langue vers laquelle rediriger une page française :
 * 1) choix explicite du sélecteur (cookie) ; 2) langue du navigateur (Accept-Language).
 * Jamais pour les robots (Google doit pouvoir indexer les pages françaises),
 * ni pour les requêtes qui ne sont pas une navigation de page (prefetch, PDF, fetch…).
 */
function preferredLocale(request: NextRequest): string {
  if (request.method !== "GET") return DEFAULT_LOCALE;
  const h = request.headers;
  if (BOT_UA.test(h.get("user-agent") ?? "")) return DEFAULT_LOCALE;
  const isDocument =
    h.get("sec-fetch-dest") === "document" || (!h.get("sec-fetch-dest") && (h.get("accept") ?? "").includes("text/html"));
  if (!isDocument || h.get("rsc") || h.get("next-router-prefetch")) return DEFAULT_LOCALE;
  // Routes techniques (fichiers PDF, téléchargements) : pas de redirection
  if (/\/(pdf|telecharger)$/.test(request.nextUrl.pathname)) return DEFAULT_LOCALE;

  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return localeFromAcceptLanguage(h.get("accept-language"));
}

function withLocale(request: NextRequest, locale: string, rewriteTo?: URL) {
  // On écrase toujours l'en-tête : un client ne peut pas imposer sa valeur.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return rewriteTo
    ? NextResponse.rewrite(rewriteTo, { request: { headers } })
    : NextResponse.next({ request: { headers } });
}

async function adminGuard(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, "admin");
  const isLoginPage = pathname === "/admin/login";

  // Déjà connecté sur la page de login -> dashboard
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Page protégée sans session valide -> login
  if (!isLoginPage && !session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Toutes les pages, sauf API, fichiers internes Next et fichiers statiques (avec extension).
  // Les routes /uploads et les fichiers SEO (sitemap.xml, robots.txt) sont exclus aussi.
  matcher: ["/((?!api|_next/static|_next/image|uploads|.*\\.[a-zA-Z0-9]+$).*)"],
};
