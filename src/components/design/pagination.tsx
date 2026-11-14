import Link from "next/link";
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
export default function Pagination({
  current,
  total,
  makeHref,
}: {
  current: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  if (total <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      {current > 1 ? (
        <Link className="pager-step" href={makeHref(current - 1)} rel="prev">
          <Icon d={I.chevL} size={18} /> <span>Précédent</span>
        </Link>
      ) : (
        <span className="pager-step is-disabled" aria-hidden="true">
          <Icon d={I.chevL} size={18} /> <span>Précédent</span>
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
                aria-label={`Page ${it}`}
              >
                {it}
              </Link>
            </li>
          )
        )}
      </ol>
      {current < total ? (
        <Link className="pager-step" href={makeHref(current + 1)} rel="next">
          <span>Suivant</span> <Icon d={I.chevR} size={18} />
        </Link>
      ) : (
        <span className="pager-step is-disabled" aria-hidden="true">
          <span>Suivant</span> <Icon d={I.chevR} size={18} />
        </span>
      )}
    </nav>
  );
}
