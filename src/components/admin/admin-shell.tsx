"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminLogout } from "@/lib/admin-client";
import { useI18n } from "@/components/i18n-provider";
import {
  BarChart3,
  BookOpen,
  Filter,
  MessageSquare,
  Users,
  Star,
  Settings,
  Download,
  Trash2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Clé identifiant la page active dans la navigation
export type AdminNavKey =
  | "dashboard"
  | "livres"
  | "import"
  | "nettoyage"
  | "auteurs"
  | "categories"
  | "blog"
  | "utilisateurs"
  | "avis"
  | "parametres";

interface AdminShellProps {
  active: AdminNavKey;
  children: ReactNode;
}

// Coquille commune à toutes les pages d'administration : barre latérale unique
// (desktop + mobile), en-tête avec lien « Voir le site » et déconnexion.
// Centralise la navigation pour éviter les liens incohérents entre les pages.
export function AdminShell({ active, children }: AdminShellProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    router.push("/admin/login");
    router.refresh();
  };

  const navItems: { key: AdminNavKey; href: string; label: string; Icon: typeof BookOpen }[] = [
    { key: "dashboard", href: "/admin/dashboard", label: t.admin.dashboard, Icon: BarChart3 },
    { key: "livres", href: "/admin/livres", label: t.admin.books, Icon: BookOpen },
    { key: "import", href: "/admin/import", label: "Import", Icon: Download },
    { key: "nettoyage", href: "/admin/nettoyage", label: "Nettoyage", Icon: Trash2 },
    { key: "auteurs", href: "/admin/auteurs", label: "Auteurs", Icon: Users },
    { key: "categories", href: "/admin/categories", label: t.admin.categories, Icon: Filter },
    { key: "blog", href: "/admin/blog", label: t.admin.blog, Icon: MessageSquare },
    { key: "utilisateurs", href: "/admin/utilisateurs", label: "Utilisateurs", Icon: Users },
    { key: "avis", href: "/admin/avis", label: "Avis", Icon: Star },
    { key: "parametres", href: "/admin/parametres", label: "Paramètres", Icon: Settings },
  ];

  const nav = (
    <nav className="space-y-2">
      {navItems.map(({ key, href, label, Icon }) => (
        <Link
          key={key}
          href={href}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            key === active
              ? "bg-amber-500 text-white"
              : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-amber-500" />
                <span className="text-xl font-bold">Admin</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:block lg:fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white p-4 overflow-y-auto">
        <Link href="/admin/dashboard" className="flex items-center gap-2 mb-8">
          <BookOpen className="h-8 w-8 text-amber-500" />
          <span className="text-xl font-bold">Admin</span>
        </Link>
        {nav}
      </aside>

      <div className="lg:ml-64">
        {/* En-tête */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4 ml-auto">
              <Link href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-amber-500">
                {t.admin.viewSite}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.admin.logout}
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
