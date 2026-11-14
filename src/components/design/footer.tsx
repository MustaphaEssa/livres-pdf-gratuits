"use client";

import Link from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import { categoryLabel } from "@/i18n/format";
import Logo from "./logo";

export default function DesignFooter({
  categories = [],
}: {
  categories?: { name: string; slug: string }[];
}) {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col brand">
          <Logo />
          <p>{t.footer.tagline}</p>
        </div>
        <div className="footer-col">
          <h2>{t.footer.explore}</h2>
          <Link href="/catalogue">{t.nav.catalogue}</Link>
          <Link href="/livres-audio">{t.nav.audiobooks}</Link>
          <Link href="/collections">{t.nav.collections}</Link>
          <Link href="/auteurs">{t.nav.authors}</Link>
          <Link href="/blog">{t.nav.blog}</Link>
        </div>
        <div className="footer-col">
          <h2>{t.footer.genres}</h2>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.slug} href={`/catalogue?category=${c.slug}`}>
              {categoryLabel(t, c)}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h2>{t.footer.info}</h2>
          <Link href="/a-propos">{t.nav.about}</Link>
          <Link href="/contact">{t.footer.contact}</Link>
          <Link href="/dmca">{t.footer.dmca}</Link>
          <Link href="/mentions-legales">{t.footer.legalNotice}</Link>
          <Link href="/confidentialite">{t.footer.privacy}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} livrespdfgratuits.com</span>
        <div>
          <Link href="/mentions-legales">{t.footer.legalNotice}</Link>
          <Link href="/confidentialite">{t.footer.privacy}</Link>
          <Link href="/conditions">{t.footer.terms}</Link>
        </div>
      </div>
    </footer>
  );
}
