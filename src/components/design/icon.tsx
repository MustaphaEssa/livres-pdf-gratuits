export default function Icon({
  d,
  size = 20,
  stroke = 1.8,
  fill = "none",
}: {
  d: string;
  size?: number;
  stroke?: number;
  fill?: string;
}) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const I = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3",
  shuffle: "M16 3h5v5 M4 20 21 3 M21 16v5h-5 M15 15l6 6 M4 4l5 5",
  chevL: "M15 6l-6 6 6 6",
  chevR: "M9 6l6 6-6 6",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  download: "M12 4v12 M6 11l6 6 6-6 M5 20h14",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z M6 19h13",
  bookmark: "M6 3h12v18l-6-4-6 4V3Z",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  close: "M6 6l12 12 M18 6L6 18",
  grid: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  list: "M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01",
  home: "M3 11l9-8 9 8 M5 10v10h14V10",
  flag: "M5 21V4 M5 4h12l-2 4 2 4H5",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 16v-5 M12 8h.01",
  headphones: "M4 15v-3a8 8 0 0 1 16 0v3 M4 15h3v5H5a1 1 0 0 1-1-1v-4Z M20 15h-3v5h2a1 1 0 0 0 1-1v-4Z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z M9 12l2 2 4-4",
  external: "M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  library: "M4 4h4v16H4z M10 4h4v16h-4z M16 6l4 1-3 14-4-1z",
};
