import prisma from "@/lib/db";
import { LOCALE_HEADER, localizePath, normalizeLocale } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Redirection relative : derrière le reverse proxy, request.url vaut
// http://localhost:3000/..., une URL absolue enverrait le visiteur sur localhost.
function redirect(path: string) {
  return new Response(null, {
    status: 307,
    headers: {
      Location: path,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

// « Surprenez-moi » : redirige vers la fiche d'un livre publié tiré au hasard.
export async function GET(request: Request) {
  const where = { isPublished: true, mediaType: "PDF" as const };
  const total = await prisma.book.count({ where });
  // Langue posée par le middleware (/en/livre-au-hasard → x-locale: en)
  const locale = normalizeLocale(request.headers.get(LOCALE_HEADER));
  if (total === 0) return redirect(localizePath(locale, "/catalogue"));

  const book = await prisma.book.findFirst({
    where,
    select: { slug: true },
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * total),
  });

  return redirect(localizePath(locale, book ? `/livre/${encodeURIComponent(book.slug)}` : "/catalogue"));
}
