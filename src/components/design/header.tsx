"use client";

import { useState } from "react";
import Link, { useLocalePathname } from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import Logo from "./logo";
import Icon, { I } from "./icon";
import LangSwitcher from "./lang-switcher";
import { MotifStrip } from "./patterns";
import { useAuth } from "@/components/auth/auth-modal";

export default function DesignHeader() {
  const path = useLocalePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { user, openAuth } = useAuth();
  const isCurrent = (href: string) =>
    href === "/" ? path === "/" : href === "/auteurs" ? path.startsWith("/auteur") : path.startsWith(href);

  const NAV = [
    { href: "/", label: t.nav.home },
    { href: "/catalogue", label: t.nav.catalogue },
    { href: "/auteurs", label: t.nav.authors },
    { href: "/livres-audio", label: t.nav.audiobooks },
    { href: "/collections", label: t.nav.collections },
    { href: "/blog", label: t.nav.blog },
  ];

  return (
    <header>
      <a className="skip-link" href="#contenu">
        {t.nav.skip}
      </a>
      <div className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="nav" aria-label={t.nav.main}>
            {/* « Accueil » omis sur ordinateur : le logo y mène déjà (gagne la place d'« Auteurs ») */}
            {NAV.filter((n) => n.href !== "/").map((n) => (
              <Link key={n.href} href={n.href} aria-current={isCurrent(n.href) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <LangSwitcher />
            <Link href="/catalogue" className="icon-btn" aria-label={t.nav.search}>
              <Icon d={I.search} />
            </Link>
            <Link href="/compte" className="icon-btn" aria-label={t.nav.favorites}>
              <Icon d={I.bookmark} />
            </Link>
            {user ? (
              <Link href="/compte" className="signin" title={user.email}>
                {user.name?.split(" ")[0] || t.nav.myAccount}
              </Link>
            ) : (
              <button type="button" className="signin" onClick={() => openAuth()}>
                {t.nav.signIn}
              </button>
            )}
            <button
              className="icon-btn menu-btn"
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              onClick={() => setOpen(!open)}
            >
              <Icon d={open ? I.close : I.menu} />
            </button>
          </div>
        </div>
        {open && (
          <div className="mobile-menu" id="mobile-menu">
            <nav aria-label={t.nav.mobileMenu}>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                  {n.label}
                </Link>
              ))}
              {user ? (
                <Link href="/compte" onClick={() => setOpen(false)}>
                  {t.nav.myAccount}
                </Link>
              ) : (
                <button
                  type="button"
                  className="mobile-signin"
                  onClick={() => { setOpen(false); openAuth(); }}
                >
                  {t.nav.signIn}
                </button>
              )}
              <LangSwitcher variant="list" />
            </nav>
          </div>
        )}
      </div>
      <MotifStrip />
    </header>
  );
}
