import Link from "next/link";
import DesignHeader from "@/components/design/header";
import DesignFooter from "@/components/design/footer";
import MobileTabbar from "@/components/design/mobile-tabbar";
import BookCover from "@/components/design/book-cover";
import HeroSearch from "@/components/design/hero-search";
import HeroArch from "@/components/design/hero-arch";
import LangShelf from "@/components/design/lang-shelf";
import Icon, { I } from "@/components/design/icon";
import { ZelligePattern } from "@/components/design/patterns";
import JsonLd, { websiteLd, organizationLd, itemListLd } from "@/components/seo/json-ld";
import BookCard from "@/components/design/book-card";
import {
  getFeaturedBooks,
  getLatestBooks,
  getBooksByLang,
  getLanguagesWithCounts,
  getCategoriesWithCounts,
  getTopAuthors,
  getLatestAudiobooks,
} from "@/lib/books";
import { getHomeCollections } from "@/lib/collections";
import { getLatestPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { languageLabel, sortLanguages } from "@/lib/languages";

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

export default async function HomePage() {
  // Étagère par langue : les 5 premières langues présentes (FR, EN, ES, AR… selon le catalogue)
  const shelfLangs = sortLanguages(await getLanguagesWithCounts()).slice(0, 5);

  const [newest, langBooks, featured, categories, collections, authors, audiobooks, posts] =
    await Promise.all([
      getLatestBooks(8),
      Promise.all(shelfLangs.map((l) => getBooksByLang(l.code, 8))),
      getFeaturedBooks(6),
      getCategoriesWithCounts(),
      getHomeCollections(4),
      getTopAuthors(10),
      getLatestAudiobooks(6),
      getLatestPosts(3),
    ]);

  // Arche « à la une » : données minimales sérialisables pour le composant client
  const hero = featured.slice(0, 5).map((b) => ({
    slug: b.slug,
    title: b.title,
    author: b.author,
    coverImage: b.coverImage,
    language: b.language,
    hasPdf: !!b.pdfUrl,
  }));

  return (
    <div className="ma">
      <JsonLd
        data={[
          websiteLd(),
          organizationLd(),
          itemListLd(featured, "Les livres les plus consultés"),
        ]}
      />
      <DesignHeader />

      <main className="page-main" id="contenu">
        <div className="hero-wrap">
          <ZelligePattern id="z-hero" className="fade" />
          <section className="hero">
            <div className="hero-copy">
              <span className="pill-label">Bibliothèque libre · domaine public</span>
              <h1>
                Des milliers de livres, <em>gratuits</em> et sans compte.
              </h1>
              <p className="lead">
                Trouvez un classique en français, en anglais, en espagnol, en arabe… Ouvrez sa fiche, puis
                lisez-le en ligne, téléchargez-le en PDF/EPUB ou écoutez-le.
              </p>
              <HeroSearch />
            </div>
            <div className="hero-visual">
              <HeroArch books={hero} />
            </div>
          </section>
        </div>

        {/* Emplacement réservé à un bandeau publicitaire (ex-bandeau de stats,
            masqué tant que le catalogue est petit). */}

        <LangShelf
          newest={newest}
          langs={shelfLangs.map((l, i) => ({ code: l.code, label: languageLabel(l.code), books: langBooks[i] }))}
        />

        {collections.length > 0 && (
          <section className="section wrap" aria-labelledby="lists-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">Listes de lecture</div>
                <h2 id="lists-title">Des collections pour vous guider</h2>
              </div>
              <Link href="/collections" className="link-arrow">
                Toutes les collections <Icon d={I.arrow} />
              </Link>
            </div>
            <div className="list-grid">
              {collections.map((c) => (
                <Link key={c.id} href={`/collections/${c.slug}`} className="list-card">
                  <span className="list-stack" aria-hidden="true">
                    {c.books.map(({ book }) => (
                      <span key={book.slug} className="list-stack-item">
                        <BookCover book={book} />
                      </span>
                    ))}
                  </span>
                  <span className="list-card-text">
                    <span className="list-card-title">{c.title}</span>
                    {c.description && <span className="list-card-desc">{c.description}</span>}
                    <span className="list-card-count">
                      {c._count.books} livre{c._count.books > 1 ? "s" : ""}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

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

        {authors.length > 0 && (
          <section className="section wrap" aria-labelledby="authors-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">Auteurs</div>
                <h2 id="authors-title">Les auteurs à découvrir</h2>
              </div>
              <Link href="/auteurs" className="link-arrow">
                Tous les auteurs <Icon d={I.arrow} />
              </Link>
            </div>
            <ul className="author-rail">
              {authors.map((a) => (
                <li key={a.slug}>
                  <Link href={`/auteur/${a.slug}`} className="author-chip">
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="author-photo" src={a.image} alt="" loading="lazy" />
                    ) : (
                      <span className="author-photo" aria-hidden="true">
                        {[...a.name][0]}
                      </span>
                    )}
                    <span className="author-name" dir="auto">
                      {a.name}
                    </span>
                    <span className="author-count">
                      {a.count} livre{a.count > 1 ? "s" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

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

        {audiobooks.length > 0 && (
          <section className="section wrap" aria-labelledby="audio-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">À écouter</div>
                <h2 id="audio-title">Livres audio gratuits</h2>
              </div>
              <Link href="/livres-audio" className="link-arrow">
                Tous les livres audio <Icon d={I.arrow} />
              </Link>
            </div>
            <div className="shelf">
              {audiobooks.map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
            </div>
          </section>
        )}

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
            <ol className="format-cards">
              <li className="format-card">
                <span className="format-num" aria-hidden="true">1</span>
                <span className="tag tag-read">Lire en ligne</span>
                <p>Ouvrez le livre dans le lecteur, sans rien télécharger.</p>
                <p className="opens">
                  Fonctionne sur : <strong>tout navigateur</strong>
                </p>
              </li>
              <li className="format-card">
                <span className="format-num" aria-hidden="true">2</span>
                <span className="tag tag-pdf">PDF / EPUB</span>
                <p>Un fichier à conserver, lisible hors ligne, même sur liseuse.</p>
                <p className="opens">
                  S&apos;ouvre avec : <strong>Aperçu, Acrobat, Kindle</strong>
                </p>
              </li>
              <li className="format-card">
                <span className="format-num" aria-hidden="true">3</span>
                <span className="tag tag-audio">Écouter</span>
                <p>Des livres lus à voix haute, à écouter en ligne quand la version audio existe.</p>
                <p className="opens">
                  Où : <Link href="/livres-audio">Livres audio</Link>
                </p>
              </li>
            </ol>
          </div>
        </section>

        {posts.length > 0 && (
          <section className="section wrap" aria-labelledby="posts-title">
            <div className="section-head">
              <div>
                <div className="eyebrow">Le journal</div>
                <h2 id="posts-title">Guides et articles</h2>
              </div>
              <Link href="/blog" className="link-arrow">
                Tout le blog <Icon d={I.arrow} />
              </Link>
            </div>
            <div className="post-grid">
              {posts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`post-card ${i === 0 ? "is-lead" : ""}`}
                >
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="post-cover" src={post.coverImage} alt="" loading="lazy" />
                  ) : (
                    <span className="post-cover is-empty" aria-hidden="true">
                      <ZelligePattern id={`z-post-${i}`} className="light" />
                    </span>
                  )}
                  <span className="post-body">
                    {post.categories[0] && (
                      <span className="book-cat">{post.categories[0].category.name}</span>
                    )}
                    <span className="post-title">{post.title}</span>
                    {post.excerpt && <span className="post-excerpt">{post.excerpt}</span>}
                    <span className="post-meta">{formatDate(post.publishedAt ?? post.createdAt)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <DesignFooter categories={categories} />
      <MobileTabbar />
    </div>
  );
}
