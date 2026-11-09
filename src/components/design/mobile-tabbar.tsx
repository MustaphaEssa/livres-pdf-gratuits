"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { I } from "./icon";

const TABS = [
  { href: "/", label: "Accueil", d: I.home },
  { href: "/catalogue", label: "Catalogue", d: I.book },
  { href: "/livres-audio", label: "Audio", d: I.headphones },
  { href: "/collections", label: "Collections", d: I.library },
];

export default function MobileTabbar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Navigation mobile">
      {TABS.map((t) => {
        const current = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link key={t.label} href={t.href} aria-current={current ? "page" : undefined}>
            <Icon d={t.d} size={22} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
