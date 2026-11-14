import Link from "@/i18n/navigation";
import DesignShell from "@/components/design/shell";
import Icon, { I } from "@/components/design/icon";
import { getServerI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getServerI18n();
  return (
    <DesignShell>
      <div className="wrap">
        <div className="empty" style={{ margin: "48px auto 72px", maxWidth: 560 }}>
          <div style={{ font: "600 72px var(--ma-serif)", color: "var(--brand-orange, #fca311)", lineHeight: 1 }}>404</div>
          <h1 style={{ fontSize: 30 }}>{t.notFound.title}</h1>
          <p>{t.notFound.text}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-primary">
              <Icon d={I.home} /> {t.notFound.home}
            </Link>
            <Link href="/catalogue" className="btn btn-outline">
              <Icon d={I.search} /> {t.notFound.browse}
            </Link>
          </div>
        </div>
      </div>
    </DesignShell>
  );
}
