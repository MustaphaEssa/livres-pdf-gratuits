import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Livres PDF Gratuits — accueil">
      <svg width="32" height="38" viewBox="0 0 32 38" aria-hidden="true">
        <path d="M2 36V15C2 7 8 2 16 2s14 5 14 13v21Z" fill="#2d3fa6" />
        <path d="M8 34V16c0-5 3-8 8-8s8 3 8 8v18Z" fill="#faf6ef" />
        <path
          d="M16 14v20 M16 18c-3-2-5-2-6-2v14c1 0 3 0 6 2 3-2 5-2 6-2V16c-1 0-3 0-6 2Z"
          fill="none"
          stroke="#2d3fa6"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="logo-text">
        Livres<span>PDF</span>Gratuits
      </span>
    </Link>
  );
}
