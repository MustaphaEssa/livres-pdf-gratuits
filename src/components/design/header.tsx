"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "./logo";
import Icon, { I } from "./icon";
import { MotifStrip } from "./patterns";
import { useAuth } from "@/components/auth/auth-modal";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/livres-audio", label: "Livres audio" },
  { href: "/collections", label: "Collections" },
  { href: "/blog", label: "Blog" },
];

export default function DesignHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { user, openAuth } = useAuth();
  const isCurrent = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <div className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="nav" aria-label="Navigation principale">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} aria-current={isCurrent(n.href) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/catalogue" className="icon-btn" aria-label="Rechercher">
              <Icon d={I.search} />
            </Link>
            <Link href="/compte" className="icon-btn" aria-label="Mes favoris">
              <Icon d={I.bookmark} />
            </Link>
            {user ? (
              <Link href="/compte" className="signin" title={user.email}>
                {user.name?.split(" ")[0] || "Mon compte"}
              </Link>
            ) : (
              <button type="button" className="signin" onClick={() => openAuth()}>
                Se connecter
              </button>
            )}
            <button
              className="icon-btn menu-btn"
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setOpen(!open)}
            >
              <Icon d={open ? I.close : I.menu} />
            </button>
          </div>
        </div>
        {open && (
          <div className="mobile-menu" id="mobile-menu">
            <nav aria-label="Menu mobile">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} onClick={() => setOpen(false)}>
                  {n.label}
                </Link>
              ))}
              {user ? (
                <Link href="/compte" onClick={() => setOpen(false)}>
                  Mon compte
                </Link>
              ) : (
                <button
                  type="button"
                  className="mobile-signin"
                  onClick={() => { setOpen(false); openAuth(); }}
                >
                  Se connecter
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
      <MotifStrip />
    </header>
  );
}
