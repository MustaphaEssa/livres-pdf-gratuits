"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, useMemo, type ComponentProps } from "react";
import { useI18n } from "@/components/i18n-provider";
import { localizePath, stripLocale, type Locale } from "./config";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Remplaçant de next/link : préfixe automatiquement les liens internes avec la
 * langue courante (/catalogue → /en/catalogue). Utilisable aussi dans les
 * composants serveur (c'est un composant client).
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps & { locale?: Locale }>(function LocaleLink(
  { href, locale: forced, ...rest },
  ref
) {
  const { locale: current } = useI18n();
  const locale = forced ?? current;
  const localized = typeof href === "string" ? localizePath(locale, href) : href;
  return <NextLink ref={ref} href={localized} {...rest} />;
});

export default Link;

/** Préfixe un chemin interne avec la langue courante. */
export function useLocalizedHref() {
  const { locale } = useI18n();
  return (href: string) => localizePath(locale, href);
}

/** Chemin courant SANS préfixe de langue (« /en/catalogue » → « /catalogue »). */
export function useLocalePathname(): string {
  return stripLocale(usePathname() || "/");
}

/** router.push / replace qui conservent la langue courante. */
export function useLocaleRouter() {
  const router = useRouter();
  const { locale } = useI18n();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, opts?: Parameters<typeof router.push>[1]) => router.push(localizePath(locale, href), opts),
      replace: (href: string, opts?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizePath(locale, href), opts),
    }),
    [router, locale]
  );
}
