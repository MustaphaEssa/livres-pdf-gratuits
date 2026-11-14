import Link from "@/i18n/navigation";
import { getServerI18n } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import Icon, { I } from "./icon";

// Numéros de page à afficher, avec ellipses (…)
function pageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

/** Pagination en liens simples (indexable, fonctionne sans JavaScript). */
export default async function Pagination({
  current,
  total,
  makeHref,
}: {
  current: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  if (total <= 1) return null;
  const { t } = await getServerI18n();
  return (
    <nav className="pager" aria-label={t.common.pagination}>
      {current > 1 ? (
        <Link className="pager-step" href={makeHref(current - 1)} rel="prev">
          <Icon d={I.chevL} size={18} /> <span>{t.common.previous}</span>
        </Link>
      ) : (
        <span className="pager-step is-disabled" aria-hidden="true">
          <Icon d={I.chevL} size={18} /> <span>{t.common.previous}</span>
        </span>
      )}
      <ol className="pager-pages">
        {pageItems(current, total).map((it, i) =>
          it === "…" ? (
            <li key={`e${i}`} className="pager-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={it}>
              <Link
                className="pager-num"
                href={makeHref(it)}
                aria-current={it === current ? "page" : undefined}
                aria-label={fmt(t.common.page, { n: it })}
              >
                {it}
              </Link>
            </li>
          )
        )}
      </ol>
      {current < total ? (
        <Link className="pager-step" href={makeHref(current + 1)} rel="next">
          <span>{t.common.next}</span> <Icon d={I.chevR} size={18} />
        </Link>
      ) : (
        <span className="pager-step is-disabled" aria-hidden="true">
          <span>{t.common.next}</span> <Icon d={I.chevR} size={18} />
        </span>
      )}
    </nav>
  );
}
