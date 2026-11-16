"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Invite les visiteurs Android à installer l'application (lecture hors-ligne).
// N'apparaît que si NEXT_PUBLIC_ANDROID_APP_LIVE=1 (à activer une fois l'app publiée
// sur Google Play), sur Android, hors admin, hors application, et jamais plus d'une
// fois tous les 14 jours après fermeture.
const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.livrespdfgratuits.livres&referrer=utm_source%3Dwebsite%26utm_medium%3Dbanner";
const KEY = "android-app-banner-dismissed";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

type Copy = { title: string; text: string; cta: string; close: string };
const COPY: Record<string, Copy> = {
  fr: { title: "Lisez hors-ligne avec l'app Android", text: "Téléchargez vos livres et lisez-les sans connexion, gratuitement.", cta: "Installer", close: "Plus tard" },
  en: { title: "Read offline with the Android app", text: "Download your books and read them without a connection, for free.", cta: "Install", close: "Not now" },
  es: { title: "Lee sin conexión con la app Android", text: "Descarga tus libros y léelos sin Internet, gratis.", cta: "Instalar", close: "Más tarde" },
  ar: { title: "اقرأ بدون اتصال مع تطبيق أندرويد", text: "حمّل كتبك واقرأها دون إنترنت، مجانًا.", cta: "تثبيت", close: "لاحقًا" },
  de: { title: "Offline lesen mit der Android-App", text: "Lade deine Bücher herunter und lies sie ohne Internet – kostenlos.", cta: "Installieren", close: "Später" },
  it: { title: "Leggi offline con l'app Android", text: "Scarica i tuoi libri e leggili senza connessione, gratis.", cta: "Installa", close: "Più tardi" },
  pt: { title: "Leia offline com o app Android", text: "Baixe seus livros e leia sem internet, de graça.", cta: "Instalar", close: "Agora não" },
  nl: { title: "Lees offline met de Android-app", text: "Download je boeken en lees ze zonder internet, gratis.", cta: "Installeren", close: "Later" },
  ru: { title: "Читайте офлайн в приложении для Android", text: "Скачивайте книги и читайте без интернета — бесплатно.", cta: "Установить", close: "Позже" },
  tr: { title: "Android uygulamasıyla çevrimdışı okuyun", text: "Kitaplarınızı indirin ve internetsiz, ücretsiz okuyun.", cta: "Yükle", close: "Sonra" },
  zh: { title: "使用安卓应用离线阅读", text: "免费下载图书，无需网络即可阅读。", cta: "安装", close: "以后再说" },
  ja: { title: "Android アプリでオフライン読書", text: "本をダウンロードして、ネットなしで無料で読めます。", cta: "インストール", close: "あとで" },
};

export default function AndroidAppBanner({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANDROID_APP_LIVE !== "1") return;
    const ua = navigator.userAgent;
    // Android uniquement ; pas dans une WebView (dont l'app elle-même)
    if (!/Android/i.test(ua) || /; wv\)|Version\/[\d.]+ Chrome/i.test(ua)) return;
    try {
      const at = Number(localStorage.getItem(KEY) || 0);
      if (at && Date.now() - at < SNOOZE_MS) return;
    } catch {}
    setShow(true);
  }, []);

  if (!show || pathname?.startsWith("/admin")) return null;
  const c = COPY[locale] ?? COPY.en;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label={c.title}
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 60,
        background: "#14213D",
        color: "#fff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 8px 30px rgba(0,0,0,.35)",
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <img src="/apple-icon.png" alt="" width={48} height={48} style={{ borderRadius: 12, flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: 15, lineHeight: 1.25 }}>{c.title}</strong>
        <span style={{ display: "block", fontSize: 13, opacity: 0.85, marginTop: 2 }}>{c.text}</span>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <a
            href={PLAY_URL}
            onClick={dismiss}
            style={{ background: "#FCA311", color: "#14213D", fontWeight: 700, padding: "10px 18px", borderRadius: 10, minHeight: 44, display: "inline-flex", alignItems: "center", textDecoration: "none" }}
          >
            {c.cta}
          </a>
          <button
            type="button"
            onClick={dismiss}
            style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.4)", padding: "10px 16px", borderRadius: 10, minHeight: 44, cursor: "pointer" }}
          >
            {c.close}
          </button>
        </div>
      </div>
    </div>
  );
}
