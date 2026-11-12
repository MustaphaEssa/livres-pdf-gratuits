import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Calendar, BookOpen, Heart, Download } from "lucide-react";
import DesignShell from "@/components/design/shell";
import BookCard from "@/components/design/book-card";
import { LogoutButton } from "@/components/account/logout-button";
import { ProfileForm } from "@/components/account/profile-form";
import { getUserSession } from "@/lib/user-server";
import { getUserDownloads } from "@/lib/books";
import { getServerI18n } from "@/i18n/server";
import prisma from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Mon compte" };

const cardStyle = {
  background: "#fff",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  padding: 24,
} as const;

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

  const infoRows = [
    { Icon: User, label: t.compte.fullName, value: user.name },
    { Icon: Mail, label: t.compte.email, value: user.email },
    { Icon: Calendar, label: t.compte.memberSince, value: formatDate(user.createdAt) },
  ];

  return (
    <DesignShell>
      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 72, maxWidth: 1100 }}>
        {/* En-tête */}
        <div className="page-head" style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span
            className="avatar"
            aria-hidden="true"
            style={{ width: 72, height: 72, fontSize: 30, background: "var(--accent)", color: "#fff" }}
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1>
              {t.compte.hello}, {user.name.split(" ")[0]}
            </h1>
            <p style={{ color: "var(--muted)", marginTop: 4 }}>{t.compte.welcome}</p>
          </div>
        </div>

        {/* Infos + profil */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <section style={cardStyle} aria-labelledby="info-title">
            <h2 id="info-title" style={{ fontSize: 20, marginBottom: 18 }}>
              {t.compte.info}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {infoRows.map(({ Icon, label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon size={20} style={{ color: "var(--terra)", flex: "none" }} />
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
                    <div dir="auto">{value}</div>
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 6 }}>
                <LogoutButton />
              </div>
            </div>
          </section>

          <section style={cardStyle} aria-labelledby="profile-title">
            <h2 id="profile-title" style={{ fontSize: 20, marginBottom: 18 }}>
              {t.compte.editProfile}
            </h2>
            <ProfileForm initialName={user.name} />
          </section>
        </div>

        {/* Favoris */}
        <section style={{ marginBottom: 40 }} aria-labelledby="fav-title">
          <h2
            id="fav-title"
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, marginBottom: 16 }}
          >
            <Heart size={20} style={{ color: "var(--terra)" }} /> {t.compte.favorites}
            {favoriteBooks.length > 0 && (
              <span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 400 }}>
                ({favoriteBooks.length})
              </span>
            )}
          </h2>
          {favoriteBooks.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>{t.compte.noFavorites}</p>
          ) : (
            <div className="grid-books">
              {favoriteBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        {/* Historique de téléchargements */}
        <section aria-labelledby="dl-title">
          <h2
            id="dl-title"
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, marginBottom: 16 }}
          >
            <Download size={20} style={{ color: "var(--terra)" }} /> {t.compte.downloads}
          </h2>
          {downloads.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              {t.compte.noDownloads}{" "}
              <Link href="/catalogue" className="link-arrow" style={{ minHeight: 0, display: "inline" }}>
                {t.compte.exploreCatalogue}
              </Link>
            </p>
          ) : (
            <div className="grid-books">
              {downloads.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        <div style={{ marginTop: 40 }}>
          <Link href="/catalogue" className="btn btn-primary">
            <BookOpen size={18} /> {t.compte.exploreCatalogue}
          </Link>
        </div>
      </div>
    </DesignShell>
  );
}
