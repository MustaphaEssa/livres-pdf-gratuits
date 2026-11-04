import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Protège toutes les routes /admin/* côté serveur, sauf la page de connexion.
export async function middleware(request: NextRequest) {
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
  // Applique le middleware à toutes les pages /admin (pas aux routes /api)
  matcher: ["/admin/:path*"],
};
