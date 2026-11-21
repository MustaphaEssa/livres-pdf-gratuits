"use client";

import { useEffect, useState } from "react";
import Link from "@/i18n/navigation";
import { useI18n } from "@/components/i18n-provider";
import Icon, { I } from "./icon";

/**
 * Barre d'action fixe en bas d'écran sur mobile (fiche livre) : « Lire en ligne »
 * et « PDF » restent à portée de pouce. Elle n'apparaît que lorsque les boutons
 * du haut de fiche sont sortis de l'écran (pas de doublon visible).
 */
export default function BookActionBar({
  readerHref,
  downloadHref,
  listenHref,
}: {
  readerHref?: string | null;
  downloadHref?: string | null;
  listenHref?: string | null;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(".book-hero .actions");
    if (!target) return;
    // Visible quand les boutons du haut sont passés au-dessus de l'écran
    const update = () => setVisible(target.getBoundingClientRect().bottom < 0);
    const io = new IntersectionObserver(update, { threshold: 0 });
    io.observe(target);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  if (!readerHref && !downloadHref && !listenHref) return null;

  return (
    <div className="book-action-bar" data-visible={visible} aria-hidden={!visible}>
      {readerHref ? (
        <Link className="btn btn-primary" href={readerHref} tabIndex={visible ? 0 : -1}>
          <Icon d={I.book} size={18} /> {t.book.readOnline}
        </Link>
      ) : listenHref ? (
        <a className="btn btn-primary" href={listenHref} tabIndex={visible ? 0 : -1}>
          <Icon d={I.headphones} size={18} /> {t.book.listen}
        </a>
      ) : null}
      {downloadHref && (
        <a className="btn btn-outline" href={downloadHref} tabIndex={visible ? 0 : -1} aria-label={t.book.downloadPdf} data-rate-trigger>
          <Icon d={I.download} size={18} /> PDF
        </a>
      )}
    </div>
  );
}
