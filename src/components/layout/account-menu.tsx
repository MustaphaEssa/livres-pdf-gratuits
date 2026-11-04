"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown, LogIn, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import {
  fetchCurrentUser,
  userLogout,
  type CurrentUser,
} from "@/lib/user-client";

export function AccountMenu({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUser().then((u) => {
      if (active) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Ferme le menu au clic extérieur
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleLogout = async () => {
    await userLogout();
    setUser(null);
    setOpen(false);
    router.refresh();
  };

  // Rien tant que l'état n'est pas connu (évite le clignotement)
  if (loading) {
    return <div className={variant === "desktop" ? "w-24" : "h-9"} aria-hidden />;
  }

  // --- Mobile ---
  if (variant === "mobile") {
    if (!user) {
      return (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
          <Link href="/auth/connexion">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <LogIn className="h-4 w-4 mr-2" />
              {t.account.login}
            </Button>
          </Link>
          <Link href="/auth/inscription">
            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 justify-start">
              <User className="h-4 w-4 mr-2" />
              {t.account.register}
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
        <div className="flex items-center gap-2 px-1 py-2 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-medium text-slate-900 dark:text-white truncate">
              {user.name}
            </div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
        </div>
        <Link href="/compte">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <UserCircle className="h-4 w-4 mr-2" />
            {t.account.myAccount}
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t.account.logout}
        </Button>
      </div>
    );
  }

  // --- Desktop ---
  if (!user) {
    return (
      <Link href="/auth/connexion">
        <Button variant="outline" size="sm">
          <LogIn className="h-4 w-4 mr-2" />
          {t.account.login}
        </Button>
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-semibold mr-1">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 py-1 z-50"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {user.name}
            </div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
          </div>
          <Link
            href="/compte"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <UserCircle className="h-4 w-4" />
            {t.account.myAccount}
          </Link>
          <button
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            {t.account.logout}
          </button>
        </div>
      )}
    </div>
  );
}
