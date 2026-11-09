/** Étoile/zellige : motif en fond (signature du site). */
export function ZelligePattern({ id, className = "" }: { id: string; className?: string }) {
  return (
    <svg className={`pattern-bg ${className}`} aria-hidden="true">
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="16" y="16" width="24" height="24" />
            <rect x="16" y="16" width="24" height="24" transform="rotate(45 28 28)" />
            <circle cx="28" cy="28" r="4.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Frise de losanges sous l'en-tête. */
export function MotifStrip() {
  return (
    <div className="motif-strip" aria-hidden="true">
      <svg>
        <defs>
          <pattern id="zs" width="20" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 1 17 5 10 9 3 5Z" fill="#2d3fa6" opacity=".85" />
          </pattern>
        </defs>
        <rect width="100%" height="10" fill="url(#zs)" />
      </svg>
    </div>
  );
}
