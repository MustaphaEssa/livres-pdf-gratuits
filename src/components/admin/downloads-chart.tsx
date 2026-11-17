"use client";

import { useMemo, useState } from "react";

export interface SeriesPoint {
  date: string; // AAAA-MM-JJ
  web: number;
  app: number;
  count: number;
}

// Bleu nuit en clair, bleu clair en sombre (contraste suffisant sur les deux fonds)
const WEB_BG = "bg-[#14213d] dark:bg-sky-300";
const APP_COLOR = "#f59e0b";

// Graduation « ronde » de l'axe vertical (1, 2, 5 × 10^n)
function niceMax(max: number): { top: number; step: number } {
  if (max <= 4) return { top: 4, step: 1 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  return { top: Math.ceil(max / step) * step, step };
}

function fmtDay(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
}

// Au-delà de 90 jours, regroupe par semaine pour garder des barres lisibles
function bucket(series: SeriesPoint[]): (SeriesPoint & { end: string })[] {
  if (series.length <= 90) return series.map((p) => ({ ...p, end: p.date }));
  const out: (SeriesPoint & { end: string })[] = [];
  for (let i = 0; i < series.length; i += 7) {
    const chunk = series.slice(i, i + 7);
    out.push({
      date: chunk[0].date,
      end: chunk[chunk.length - 1].date,
      web: chunk.reduce((s, p) => s + p.web, 0),
      app: chunk.reduce((s, p) => s + p.app, 0),
      count: chunk.reduce((s, p) => s + p.count, 0),
    });
  }
  return out;
}

export function DownloadsChart({ series }: { series: SeriesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const points = useMemo(() => bucket(series), [series]);
  const weekly = series.length > 90;
  const { top, step } = niceMax(Math.max(0, ...points.map((p) => p.count)));
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).reverse();

  // Nombre d'étiquettes de dates affichées sous l'axe (~8 au maximum)
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const h = hover !== null ? points[hover] : null;

  return (
    <div>
      <div className="flex gap-2">
        {/* Axe vertical */}
        <div className="flex flex-col justify-between h-56 text-[11px] text-slate-400 text-right w-8 shrink-0 -my-1.5">
          {ticks.map((t) => (
            <span key={t}>{t.toLocaleString("fr-FR")}</span>
          ))}
        </div>

        <div className="relative flex-1 h-56" onMouseLeave={() => setHover(null)}>
          {/* Lignes de graduation */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {ticks.map((t) => (
              <div
                key={t}
                className={`border-t ${t === 0 ? "border-slate-300 dark:border-slate-600" : "border-dashed border-slate-200 dark:border-slate-700"}`}
              />
            ))}
          </div>

          {/* Barres empilées : site web (bas) + application (haut) */}
          <div className="absolute inset-0 flex items-end gap-px">
            {points.map((p, i) => (
              <div
                key={p.date}
                className="flex-1 h-full flex flex-col justify-end cursor-default"
                onMouseEnter={() => setHover(i)}
              >
                <div
                  className="w-full flex flex-col justify-end rounded-t-sm overflow-hidden transition-opacity"
                  style={{
                    height: `${(p.count / top) * 100}%`,
                    opacity: hover === null || hover === i ? 1 : 0.45,
                  }}
                >
                  <div style={{ height: `${p.count ? (p.app / p.count) * 100 : 0}%`, background: APP_COLOR }} />
                  <div className={WEB_BG} style={{ height: `${p.count ? (p.web / p.count) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Infobulle */}
          {h && hover !== null && (
            <div
              className="absolute top-0 z-10 pointer-events-none rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 px-3 py-2 text-xs whitespace-nowrap"
              style={{
                left: `${((hover + 0.5) / points.length) * 100}%`,
                transform: `translateX(${hover / points.length > 0.6 ? "-105%" : "5%"})`,
              }}
            >
              <div className="font-medium text-slate-900 dark:text-white mb-1">
                {weekly
                  ? `${fmtDay(h.date, { day: "numeric", month: "short" })} – ${fmtDay(h.end, { day: "numeric", month: "short", year: "numeric" })}`
                  : fmtDay(h.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className={`w-2 h-2 rounded-sm ${WEB_BG}`} /> Site web
                <span className="ml-auto font-medium">{h.web.toLocaleString("fr-FR")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-sm" style={{ background: APP_COLOR }} /> App Android
                <span className="ml-auto pl-4 font-medium">{h.app.toLocaleString("fr-FR")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 mt-1 pt-1 font-medium text-slate-900 dark:text-white">
                Total <span>{h.count.toLocaleString("fr-FR")}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Axe horizontal */}
      <div className="flex gap-px ml-10 mt-1.5">
        {points.map((p, i) => (
          <div key={p.date} className="flex-1 text-[11px] text-slate-400 text-center overflow-visible whitespace-nowrap">
            {i % labelEvery === 0 ? fmtDay(p.date, { day: "numeric", month: "short" }) : ""}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${WEB_BG}`} /> Site web
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: APP_COLOR }} /> App Android
        </span>
        {weekly && <span className="ml-auto">Regroupé par semaine</span>}
      </div>
    </div>
  );
}
