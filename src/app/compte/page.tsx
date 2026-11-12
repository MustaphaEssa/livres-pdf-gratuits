import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Calendar, BookOpen, Heart, Download } from "lucide-react";
import DesignShell from "@/components/design/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCard } from "@/components/books/book-card";
import { LogoutButton } from "@/components/account/logout-button";
import { ProfileForm } from "@/components/account/profile-form";
import { getUserSession } from "@/lib/user-server";
import { getUserDownloads } from "@/lib/books";
import { getServerI18n } from "@/i18n/server";
import prisma from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mon compte" };

export default async function ComptePage() {
  const session = await getUserSession();
  if (!session) redirect("/auth/connexion?from=/compte");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, email: true, createdAt: true },
  });
  if (!user) redirect("/auth/connexion?from=/compte");

  const { t } = await getServerI18n();
  const [favorites, downloads] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      include: {
        book: {
          include: {
            categories: { include: { category: { select: { name: true, slug: true } } } },
          },
        },
      },
    }),
    getUserDownloads(session.sub, 12),
  ]);
  const favoriteBooks = favorites.map((f) => f.book);

  return (
    <DesignShell>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
          {/* En-tête */}
          <div className="flex items-center gap-4 mb-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.compte.hello}, {user.name.split(" ")[0]}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t.compte.welcome}
              </p>
            </div>
          </div>

          {/* Infos + profil */}
          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>{t.compte.info}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="text-xs text-slate-500">{t.compte.fullName}</div>
                    <div className="text-slate-900 dark:text-white">{user.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="text-xs text-slate-500">{t.compte.email}</div>
                    <div className="text-slate-900 dark:text-white">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="text-xs text-slate-500">{t.compte.memberSince}</div>
                    <div className="text-slate-900 dark:text-white">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <LogoutButton />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.compte.editProfile}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm initialName={user.name} />
              </CardContent>
            </Card>
          </div>

          {/* Favoris */}
          <section className="mb-10">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white mb-4">
              <Heart className="h-5 w-5 text-red-500" /> {t.compte.favorites}
              {favoriteBooks.length > 0 && (
                <span className="text-sm text-slate-500">({favoriteBooks.length})</span>
              )}
            </h2>
            {favoriteBooks.length === 0 ? (
              <p className="text-slate-500 text-sm">{t.compte.noFavorites}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {favoriteBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </section>

          {/* Historique de téléchargements */}
          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white mb-4">
              <Download className="h-5 w-5 text-amber-500" /> {t.compte.downloads}
            </h2>
            {downloads.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {t.compte.noDownloads}{" "}
                <Link href="/catalogue" className="text-amber-500 hover:underline">
                  {t.compte.exploreCatalogue}
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {downloads.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </section>

          <div className="mt-10">
            <Link href="/catalogue">
              <Button className="bg-amber-500 hover:bg-amber-600">
                <BookOpen className="h-4 w-4 mr-2" /> {t.compte.exploreCatalogue}
              </Button>
            </Link>
          </div>
      </div>
    </DesignShell>
  );
}
