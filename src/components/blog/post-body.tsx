import type { ReactNode } from "react";
import Link from "@/i18n/navigation";

/*
 * Corps d'article de blog : Markdown minimal, rendu en éléments React (pas de HTML brut).
 *
 *   ## Intertitre        → <h2 id="…">     ### Sous-titre → <h3>
 *   - élément (lignes)   → <ul><li>
 *   [texte](/livre/x)    → lien interne (externe si http…)
 *   **gras**             → <strong>
 *
 * Les anciens articles (paragraphes simples séparés par une ligne vide) s'affichent
 * comme avant.
 */

const slugId = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[1] !== undefined) {
      const href = m[2];
      out.push(
        href.startsWith("/") ? (
          <Link key={key} href={href}>
            {m[1]}
          </Link>
        ) : (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {m[1]}
          </a>
        )
      );
    } else {
      out.push(<strong key={key}>{m[3]}</strong>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const h2Style = { marginTop: 18, fontSize: "clamp(22px, 3vw, 28px)", lineHeight: 1.25 } as const;
const h3Style = { marginTop: 6, fontSize: 20, lineHeight: 1.3 } as const;

export default function PostBody({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="article-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {blocks.map((b, i) => {
        const k = `b${i}`;
        if (b.startsWith("### ")) {
          const t = b.slice(4).trim();
          return (
            <h3 key={k} id={slugId(t)} style={h3Style}>
              {inline(t, k)}
            </h3>
          );
        }
        if (b.startsWith("## ")) {
          const t = b.slice(3).trim();
          return (
            <h2 key={k} id={slugId(t)} style={h2Style}>
              {inline(t, k)}
            </h2>
          );
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*-\s+/.test(l))) {
          return (
            <ul key={k} className="prose" style={{ maxWidth: "none", paddingInlineStart: 22, display: "grid", gap: 8 }}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*-\s+/, ""), `${k}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={k} className="prose" style={{ maxWidth: "none" }}>
            {inline(lines.join(" "), k)}
          </p>
        );
      })}
    </div>
  );
}
