"use client";

import { useRef, useState } from "react";
import { Play, Pause, Headphones } from "lucide-react";

export interface AudioTrack {
  title: string;
  url: string;
  duration: number; // secondes
}

function fmt(sec: number): string {
  if (!sec || sec < 0) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? `${h}:` : "") + `${mm}:${String(s).padStart(2, "0")}`;
}

/**
 * Lecteur de livre audio : lit en streaming les chapitres depuis Internet
 * Archive (rien n'est stocké sur le serveur). Liste cliquable des chapitres.
 */
export function AudioPlayer({
  tracks,
  totalDuration,
}: {
  tracks: AudioTrack[];
  totalDuration?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  if (!tracks.length) {
    return (
      <p className="text-slate-500">
        Les chapitres de ce livre audio ne sont pas disponibles pour le moment.
      </p>
    );
  }

  const playTrack = (i: number) => {
    setCurrent(i);
    // Laisse le temps à <source> de se mettre à jour avant de lancer la lecture
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (!el) return;
      el.load();
      el.play().catch(() => {});
    });
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const onEnded = () => {
    if (current < tracks.length - 1) playTrack(current + 1);
    else setPlaying(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Barre de lecture */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60">
        <button
          type="button"
          onClick={togglePlay}
          className="flex-shrink-0 h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow"
          aria-label={playing ? "Pause" : "Lecture"}
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium mb-0.5">
            <Headphones className="h-3.5 w-3.5" /> Chapitre {current + 1} / {tracks.length}
          </div>
          <div className="truncate font-medium text-slate-900 dark:text-white">
            {tracks[current].title}
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        className="w-full"
        controls
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
      >
        <source src={tracks[current].url} />
      </audio>

      {/* Liste des chapitres */}
      <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
        {tracks.map((tr, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => playTrack(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-slate-800 ${
                i === current ? "bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 font-medium" : "text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="flex-shrink-0 w-6 text-right tabular-nums text-slate-400">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{tr.title}</span>
              {tr.duration > 0 && (
                <span className="flex-shrink-0 tabular-nums text-xs text-slate-400">
                  {fmt(tr.duration)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {totalDuration ? (
        <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
          Durée totale : {fmt(totalDuration)}
        </div>
      ) : null}
    </div>
  );
}
