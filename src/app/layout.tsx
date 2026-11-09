import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { SettingsProvider } from "@/components/settings-provider";
import { Analytics } from "@/components/analytics";
import { getLocale } from "@/i18n/server";
import { getSiteSettings } from "@/lib/settings";
import { isRtl } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const defaultTitle = `${settings.siteName} | Téléchargez des milliers de livres gratuits`;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: defaultTitle,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.siteDescription,
    keywords: [
      "livre pdf gratuit",
      "télécharger pdf",
      "livres gratuits",
      "bibliothèque numérique",
      "ebook gratuit",
    ],
    authors: [{ name: settings.siteName }],
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: SITE_URL,
      siteName: settings.siteName,
      title: defaultTitle,
      description: settings.siteDescription,
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: settings.siteName },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteName,
      description: settings.siteDescription,
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
        className={`${inter.variable} ${arabic.variable} ${
          rtl ? "font-arabic" : "font-sans"
        } antialiased`}
      >
        <NextTopLoader color="#f59e0b" height={3} showSpinner={false} />
        <I18nProvider locale={locale}>
          <SettingsProvider settings={settings}>{children}</SettingsProvider>
        </I18nProvider>

        {/* Google Analytics (si configuré) — exclu des pages /admin */}
        <Analytics gaId={settings.googleAnalyticsId} />
      </body>
    </html>
  );
}
