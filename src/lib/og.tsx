import { ImageResponse } from "next/og";

// Cartes Open Graph / Twitter 1200×630 générées à la volée (next/og, sans dépendance).
// La police intégrée de next/og ne couvre que l'alphabet latin : les titres en
// arabe, chinois, cyrillique… sont remplacés par le nom du site plutôt que
// d'afficher des carrés vides.
// NB : en dev sous Windows, next/og 15.1 échoue à charger sa police (bug de chemin
// « file:\C:\… ») ; aucun souci sous Linux (production).

export const OG_SIZE = { width: 1200, height: 630 };
const BG = "#f6f1e7";
const INK = "#1d1a16";
const ACCENT = "#b4532a";

const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}\p{S}]+$/u;
const latinOr = (s: string, fallback: string) => (LATIN.test(s) ? s : fallback);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Image distante → data URL (JPEG/PNG seulement : formats lus par next/og). */
export async function fetchImageData(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (type !== "image/jpeg" && type !== "image/png") return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

interface CardInput {
  siteName: string;
  title: string;
  subtitle?: string;
  badge?: string;
  cover?: string | null;
}

export function ogCard({ siteName, title, subtitle, badge, cover }: CardInput) {
  const t = clip(latinOr(title, siteName), 90);
  const sub = subtitle ? clip(latinOr(subtitle, ""), 60) : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG, color: INK, padding: 64, gap: 56 }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={334}
            height={502}
            style={{ objectFit: "cover", borderRadius: 8, boxShadow: "0 18px 40px rgba(0,0,0,.25)" }}
          />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, color: ACCENT }}>{siteName}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: t.length > 50 ? 52 : 64, lineHeight: 1.1 }}>{t}</div>
            {sub ? <div style={{ display: "flex", fontSize: 34, color: "#5b544a" }}>{sub}</div> : null}
          </div>
          {badge ? (
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", background: ACCENT, color: "#fff", fontSize: 28, padding: "12px 24px", borderRadius: 999 }}>
                {badge}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
    }
  );
}
