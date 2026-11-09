import Link from "next/link";
import Logo from "./logo";

export default function DesignFooter({
  categories = [],
}: {
  categories?: { name: string; slug: string }[];
}) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col brand">
          <Logo />
          <p>
            Une bibliothèque numérique libre : des livres du domaine public à télécharger en PDF,
            à lire en ligne ou à écouter, en français, anglais et arabe.
          </p>
        </div>
        <div className="footer-col">
          <h2>Explorer</h2>
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/livres-audio">Livres audio</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/auteurs">Auteurs</Link>
          <Link href="/blog">Blog</Link>
        </div>
        <div className="footer-col">
          <h2>Genres</h2>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.slug} href={`/catalogue?category=${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h2>Infos</h2>
          <Link href="/contact">Contact</Link>
          <Link href="/dmca">DMCA / droits d&apos;auteur</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} livrespdfgratuits.com</span>
        <div>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/conditions">Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
