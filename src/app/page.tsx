import Link from "next/link";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCover from "@/components/design/book-cover";
import HeroSearch from "@/components/design/hero-search";
import LangShelf from "@/components/design/lang-shelf";
import Icon, { I } from "@/components/design/icon";
import { ZelligePattern } from "@/components/design/patterns";
import {
  getFeaturedBooks,
  getLatestBooks,
  getBooksByLang,
  getCategoriesWithCounts,
} from "@/lib/books";
import prisma from "@/lib/db";

// Icônes (tracés SVG) par catégorie
const CAT_ICON: Record<string, string> = {
  romans: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z M6 19h13",
  histoire: "M3 10 12 4l9 6H3Z M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 20h18",
  biographies: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21c0-4 3.6-7 8-7s8 3 8 7",
  poesie: "M20 4c-7 0-12 4-12 11l-3 5 M20 4c0 7-4 11-11 11 M12 12h5",
  philosophie: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z",
  sciences: "M9 3h6 M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19l-5-10V3 M7.5 15h9",
  religion: "M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2V5Z M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8V5Z",
  informatique: "M8 8l-5 4 5 4 M16 8l5 4-5 4 M14 5l-4 14",
};

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}

export default async function HomePage() {
  const [newest, fr, en, ar, featured, categories, bookCount, audioCount, authorCount] =
    await Promise.all([
      getLatestBooks(8),
      getBooksByLang("fr", 8),
      getBooksByLang("en", 8),
      getBooksByLang("ar", 8),
      getFeaturedBooks(6),
      getCategoriesWithCounts(),
      prisma.book.count({ where: { isPublished: true, mediaType: "PDF" } }),
      prisma.book.count({ where: { isPublished: true, mediaType: "AUDIO" } }),
      prisma.book.groupBy({ by: ["authorSlug"], where: { isPublished: true, authorSlug: { not: null } } }),
    ]);

  const stats = [
    { value: `${fmt(bookCount)}+`, label: "livres en PDF" },
    { value: `${fmt(audioCount)}`, label: "livres audio" },
    { value: `${fmt(authorCount.length)}+`, label: "auteurs" },
    { value: "0 €", label: "toujours gratuit" },
  ];

  const hero = featured.slice(0, 3);

  return (
    <div className="ma">
      <DesignHeader />

      <main className="page-main">
        <div className="hero-wrap">
          <ZelligePattern id="z-hero" className="fade" />
          <section className="hero">
            <div className="hero-copy">
              <span className="pill-label">Bibliothèque libre · domaine public</span>
              <h1>
                Des milliers de livres, <em>gratuits</em> et sans compte.
              </h1>
              <p className="lead">
                Trouvez un classique en français, en anglais ou en arabe. Ouvrez sa fiche, puis
                lisez-le en ligne, téléchargez-le en PDF/EPUB ou écoutez-le.
              </p>
              <HeroSearch />
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-stage">
                <div className="arch" />
                <div className="arch-inner" />
                {hero[0] && (
                  <div className="hero-cover" style={{ left: "4%", top: "16%", transform: "rotate(-8deg)" }}>
                    <BookCover book={hero[0]} />
                  </div>
                )}
                {hero[1] && (
                  <div className="hero-cover" style={{ left: "30%", top: "4%", transform: "rotate(2deg)", zIndex: 2 }}>
                    <BookCover book={hero[1]} />
                  </div>
                )}
                {hero[2] && (
                  <div className="hero-cover" style={{ left: "54%", top: "20%", transform: "rotate(9deg)", zIndex: 1 }}>
                    <BookCover book={hero[2]} />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="stats">
          <div className="stats-inner">
            {stats.map((s) => (
              <div className="stat" key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <LangShelf newest={newest} byLang={{ fr, en, ar }} />

        <section className="section wrap" aria-labelledby="genres-title">
          <div className="section-head">
            <div>
              <div className="eyebrow">Explorer</div>
              <h2 id="genres-title">Parcourir par genre</h2>
            </div>
            <Link href="/catalogue" className="link-arrow">
              Tout le catalogue <Icon d={I.arrow} />
            </Link>
          </div>
          <div className="genre-grid">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/catalogue?category=${c.slug}`}
                className={`genre-tile ${i === 0 ? "is-primary" : ""}`}
              >
                <span className="genre-icon">
                  <Icon d={CAT_ICON[c.slug] || I.book} size={24} />
                </span>
                <span className="genre-foot">
                  <span>
                    <span className="genre-name">{c.name}</span>
                    <span className="genre-count">{c.count} livres</span>
                  </span>
                  <span className="genre-arrow">
                    <Icon d={I.arrow} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="band">
          <div className="band-inner">
            <div className="band-copy">
              <div className="eyebrow">À la une</div>
              <h2>Les livres les plus consultés</h2>
              <p>
                Une sélection mise à jour régulièrement. Chaque livre ouvre sa fiche, avec la
                lecture en ligne, le PDF et l&apos;audio quand il existe.
              </p>
              <Link href="/catalogue" className="btn btn-ink">
                Voir le catalogue
              </Link>
            </div>
            <ol className="featured-list">
              {featured.map((b, i) => (
                <li key={b.slug} className="featured-item">
                  <span className="featured-rank">{i + 1}</span>
                  <BookCover book={b} mini />
                  <span className="featured-text">
                    <Link href={`/livre/${b.slug}`} dir="auto">
                      {b.title}
                    </Link>
                    <span dir="auto">{b.author}</span>
                  </span>
                  <Link href={`/livre/${b.slug}`} className="round-link" aria-label={`Voir la fiche de ${b.title}`}>
                    <Icon d={I.arrow} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <section className="section wrap" aria-labelledby="help-title">
          <div className="help-strip">
            <div className="help-copy">
              <div className="eyebrow">Aide</div>
              <h2 id="help-title">Trois façons de lire, aucune application à installer</h2>
              <p>Lisez dans votre navigateur, gardez le PDF/EPUB pour hors ligne, ou écoutez.</p>
              <Link href="/blog" className="link-arrow">
                Guides de lecture <Icon d={I.arrow} />
              </Link>
            </div>
            <div className="format-cards">
              <div className="format-card">
                <span className="tag tag-read">Lire en ligne</span>
                <p>Ouvrez le livre dans le lecteur, sans rien télécharger.</p>
                <p className="opens">
                  Fonctionne sur : <strong>tout navigateur</strong>
                </p>
              </div>
              <div className="format-card">
                <span className="tag tag-pdf">PDF / EPUB</span>
                <p>Un fichier à conserver, lisible hors ligne, même sur liseuse.</p>
                <p className="opens">
                  S&apos;ouvre avec : <strong>Aperçu, Acrobat, Kindle</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section wrap">
          <div className="cta-band">
            <ZelligePattern id="z-cta" className="light" />
            <div>
              <h2>Des collections pour vous guider</h2>
              <p>Des sélections thématiques de livres, choisies autour d&apos;une idée.</p>
            </div>
            <Link className="btn" href="/collections">
              Voir les collections <Icon d={I.arrow} />
            </Link>
          </div>
        </section>
      </main>

      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
