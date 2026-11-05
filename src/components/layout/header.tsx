"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountMenu } from "@/components/layout/account-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useI18n } from "@/components/i18n-provider";
import { useSiteSettings } from "@/components/settings-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "home", href: "/" },
  { key: "catalogue", href: "/catalogue" },
  { key: "authors", href: "/auteurs" },
  { key: "blog", href: "/blog" },
  { key: "about", href: "/a-propos" },
  { key: "contact", href: "/contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const settings = useSiteSettings();
  const siteName = settings?.siteName ?? "Livre PDF Gratuit";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigation SPA (sans rechargement complet de la page)
      router.push(`/catalogue?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {settings?.logo ? (
              <Image src={settings.logo} alt={siteName} width={32} height={32} className="h-8 w-8 object-contain" />
            ) : (
              <BookOpen className="h-8 w-8 text-slate-800 dark:text-amber-500" />
            )}
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-slate-800 dark:hover:text-amber-500",
                  pathname === item.href
                    ? "text-slate-800 dark:text-amber-500"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>

          {/* Search & Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="search"
                placeholder={t.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </form>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Account */}
            <AccountMenu variant="desktop" />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSearch} className="mb-4">
              <Input
                type="search"
                placeholder={t.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-slate-800 text-white dark:bg-amber-500 dark:text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {t.nav[item.key]}
                </Link>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <LanguageSwitcher />
              </div>
              <AccountMenu variant="mobile" />
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
