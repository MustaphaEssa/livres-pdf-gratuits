import Link from "next/link";
import { Button } from "@/components/ui/button";

// Calcule les numéros de page à afficher avec des ellipses (…)
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

export function Pagination({
  currentPage,
  totalPages,
  makeHref,
}: {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const items = pageItems(currentPage, totalPages);

  return (
    <div className="flex justify-center mt-8">
      <div className="flex items-center gap-2 flex-wrap">
        {currentPage > 1 ? (
          <Link href={makeHref(currentPage - 1)}>
            <Button variant="outline" size="sm">Précédent</Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>Précédent</Button>
        )}

        {items.map((it, i) =>
          it === "…" ? (
            <span key={`e${i}`} className="px-2 text-slate-400 select-none">
              …
            </span>
          ) : (
            <Link key={it} href={makeHref(it)}>
              <Button
                variant="outline"
                size="sm"
                className={
                  it === currentPage
                    ? "bg-slate-800 text-white dark:bg-amber-500"
                    : ""
                }
              >
                {it}
              </Button>
            </Link>
          )
        )}

        {currentPage < totalPages ? (
          <Link href={makeHref(currentPage + 1)}>
            <Button variant="outline" size="sm">Suivant</Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>Suivant</Button>
        )}
      </div>
    </div>
  );
}
