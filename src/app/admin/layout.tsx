import type { Metadata } from "next";

// Le back-office ne doit jamais être indexé par les moteurs de recherche.
// Ajoute <meta name="robots" content="noindex, nofollow"> à toutes les
// pages /admin (en complément du Disallow dans robots.ts).
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
