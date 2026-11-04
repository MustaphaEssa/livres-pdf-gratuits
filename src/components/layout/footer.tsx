"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useSiteSettings } from "@/components/settings-provider";

const categoryLinks = [
  { name: "Romans", href: "/categorie/romans" },
  { name: "Sciences", href: "/categorie/sciences" },
  { name: "Histoire", href: "/categorie/histoire" },
  { name: "Informatique", href: "/categorie/informatique" },
  { name: "Religion", href: "/categorie/religion" },
];

export function Footer() {
  const { t } = useI18n();
  const settings = useSiteSettings();
  const siteName = settings?.siteName ?? "Livre PDF Gratuit";

  // Liens sociaux réellement configurés dans les paramètres
  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: settings?.facebook },
    { name: "Twitter", icon: Twitter, href: settings?.twitter },
    { name: "Instagram", icon: Instagram, href: settings?.instagram },
    { name: "Youtube", icon: Youtube, href: settings?.youtube },
  ].filter((s): s is { name: string; icon: typeof Facebook; href: string } => !!s.href);
  const companyLinks = [
    { name: t.footer.about, href: "/a-propos" },
    { name: t.footer.contact, href: "/contact" },
    { name: t.footer.blog, href: "/blog" },
    { name: t.footer.legalNotice, href: "/mentions-legales" },
  ];
  const legalLinks = [
    { name: t.footer.terms, href: "/conditions" },
    { name: t.footer.privacy, href: "/confidentialite" },
    { name: t.footer.sitemap, href: "/sitemap.xml" },
  ];
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              {settings?.logo ? (
                <Image src={settings.logo} alt={siteName} width={32} height={32} className="h-8 w-8 object-contain" />
              ) : (
                <BookOpen className="h-8 w-8 text-amber-500" />
              )}
              <span className="text-xl font-bold text-white">{siteName}</span>
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              {settings?.siteDescription || t.footer.tagline}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-amber-500 transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.categoriesTitle}</h3>
            <ul className="space-y-2">
              {categoryLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.companyTitle}</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.contactTitle}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-amber-500" />
                <span>{settings?.email || "contact@livre-pdf-gratuit.com"}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="h-4 w-4 text-amber-500" />
                <span>{settings?.telephone || "+212 6XX XXXXXX"}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-amber-500" />
                <span>{settings?.address || "Maroc"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} {siteName}. {t.footer.rights}
          </p>
          <div className="flex gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-slate-400 hover:text-amber-500 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
