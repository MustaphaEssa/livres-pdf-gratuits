import { getServerI18n } from "@/i18n/server";
import { i18nAlternates, localeRobots } from "@/i18n/seo";

export async function generateMetadata() {
  const { locale, t } = await getServerI18n();
  return { title: t.meta.contact, alternates: i18nAlternates(locale, "/contact"), ...localeRobots(locale) };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
