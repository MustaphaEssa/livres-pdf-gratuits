import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { Inter, Geist, Noto_Sans_Arabic, Source_Serif_4, Amiri } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { SettingsProvider } from "@/components/settings-provider";
import { AuthProvider } from "@/components/auth/auth-modal";
import { Analytics } from "@/components/analytics";
import { getLocale, getServerI18n } from "@/i18n/server";
import { getSiteSettings } from "@/lib/settings";
import { isRtl, LOCALES, LOCALE_INFO } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./design.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Police d'interface du design public (.ma) — l'admin garde Inter.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-ui",
});

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

// Charte « Riad de papier » (open-design : kami + redesign-skill) : serif éditorial
// Source Serif 4 + arabe serif (Amiri). Voir docs/redesign/DESIGN.md.
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, { locale, t }] = await Promise.all([getSiteSettings(), getServerI18n()]);
  const defaultTitle = `${settings.siteName} | ${t.meta.defaultTitle}`;
  // La description réglée dans l'admin est en français : on l'utilise pour le FR uniquement.
  const description = locale === "fr" ? settings.siteDescription || t.meta.description : t.meta.description;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: defaultTitle,
      template: `%s | ${settings.siteName}`,
    },
    description,
    keywords: t.meta.keywords,
    authors: [{ name: settings.siteName }],
    openGraph: {
      type: "website",
      locale: LOCALE_INFO[locale].og,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_INFO[l].og),
      url: SITE_URL,
      siteName: settings.siteName,
      title: defaultTitle,
      description,
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: settings.siteName },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteName,
      description,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);
  const rtl = isRtl(locale);
  return (
    <html lang={locale} dir={rtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geist.variable} ${arabic.variable} ${serif.variable} ${amiri.variable} ${
          rtl ? "font-arabic" : "font-sans"
        } antialiased`}
      >
        <NextTopLoader color="#fca311" height={3} showSpinner={false} />
        <I18nProvider locale={locale}>
          <SettingsProvider settings={settings}>
            <AuthProvider>{children}</AuthProvider>
          </SettingsProvider>
        </I18nProvider>

        {/* Google Analytics (si configuré) — exclu des pages /admin */}
        <Analytics gaId={settings.googleAnalyticsId} />
      </body>
    </html>
  );
}
