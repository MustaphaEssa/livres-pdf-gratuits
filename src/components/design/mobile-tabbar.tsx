"use client";

import Link, { useLocalePathname } from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import Icon, { I } from "./icon";

export default function MobileTabbar() {
  const path = useLocalePathname();
  const { t } = useI18n();
  const TABS = [
    { href: "/", label: t.nav.home, d: I.home },
    { href: "/catalogue", label: t.nav.catalogue, d: I.book },
    { href: "/livres-audio", label: t.nav.audioShort, d: I.headphones },
    { href: "/collections", label: t.nav.collections, d: I.library },
  ];
  return (
    <nav className="tabbar" aria-label={t.nav.mobile}>
      {TABS.map((tab) => {
        const current = tab.href === "/" ? path === "/" : path.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} aria-current={current ? "page" : undefined}>
            <Icon d={tab.d} size={22} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
