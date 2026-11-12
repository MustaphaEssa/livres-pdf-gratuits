import Link from "next/link";

// Marque « Livres PDF Gratuits » — carré navy, livre ouvert (page blanche + page
// orange avec flèche de téléchargement). Reprend l'identité de mark.svg.
export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Livres PDF Gratuits — accueil">
      <svg width="38" height="38" viewBox="0 0 120 120" aria-hidden="true">
        <rect width="120" height="120" rx="28" fill="#14213D" />
        <path d="M18 36 Q38 28 58 36 V90 Q38 82 18 90 Z" fill="#FFFFFF" />
        <path d="M62 36 Q82 28 102 36 V90 Q82 82 62 90 Z" fill="#FCA311" />
        <g stroke="#C9D1E3" strokeWidth="3" strokeLinecap="round">
          <path d="M26 48 Q38 44 50 48" />
          <path d="M26 57 Q38 53 50 57" />
          <path d="M26 66 Q38 62 50 66" />
          <path d="M26 75 Q34 72 42 74" />
        </g>
        <g stroke="#14213D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M82 45 V70" />
          <path d="M73 61 L82 70 L91 61" />
          <path d="M72 79 H92" />
        </g>
      </svg>
      <span className="logo-text">
        Livres<span>PDF</span>Gratuits
      </span>
    </Link>
  );
}
