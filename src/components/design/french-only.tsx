"use client";

import { useI18n } from "@/components/i18n-provider";
import Icon, { I } from "./icon";

/** Bandeau affiché sur les pages dont le contenu n'existe qu'en français (pages légales). */
export default function FrenchOnlyNotice() {
  const { locale, t } = useI18n();
  if (locale === "fr") return null;
  return (
    <p className="notice" style={{ margin: "16px 0 0", display: "flex", gap: 10, alignItems: "center" }}>
      <Icon d={I.info} size={18} /> {t.common.frenchOnly}
    </p>
  );
}
