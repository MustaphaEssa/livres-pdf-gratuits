# Mots-clés, structure de page et gabarits de contenu

Intention : **T** = transactionnelle (veut télécharger), **N** = navigationnelle (cherche un titre/auteur précis),
**I** = informationnelle (cherche des idées / à se renseigner). Les pages cibles sont indiquées entre crochets.

Le site cible des livres **du domaine public** : ne pas viser de best-sellers sous droits (« [titre récent] pdf »).
Ce trafic n'est pas atteignable légalement et expose à des retraits DMCA.

---

## Français (fr, sans préfixe)

### Principaux
| Mot-clé | Intention | Page cible |
|---|---|---|
| livre pdf gratuit | T | accueil |
| télécharger livre pdf gratuit | T | accueil |
| livres gratuits en ligne | T | catalogue |
| ebook gratuit | T | catalogue |
| bibliothèque numérique gratuite | N/I | accueil |
| livre audio gratuit | T | /livres-audio |
| lire un livre en ligne gratuitement | T | catalogue |

### Longue traîne (générée automatiquement par les fiches)
- `[titre] pdf gratuit` / `[titre] pdf` / `télécharger [titre] pdf` (T) → fiche livre
- `[auteur] pdf` / `livres de [auteur] pdf` / `[auteur] œuvres complètes pdf` (N/T) → page auteur
- `[titre] [auteur] pdf` (N) → fiche livre (le slug et le `<title>` contiennent les deux)
- `[titre] résumé` (I) → fiche livre (section « À propos »)
- `[titre] livre audio` / `[titre] audio gratuit` (T) → fiche livre audio
- `[titre] epub` (T) → fiche livre (format EPUB)
- `livres [genre] gratuits pdf` (T) → catégorie

### Par catégorie
| Catégorie | Mots-clés | Intention |
|---|---|---|
| Roman | roman pdf gratuit, roman classique pdf, roman français pdf, roman d'amour pdf gratuit | T |
| Classiques | classiques de la littérature pdf, livres du bac pdf, œuvres au programme pdf | T/I |
| Poésie | recueil de poèmes pdf, poésie française pdf gratuit, Baudelaire pdf | T |
| Théâtre | pièce de théâtre pdf, Molière pdf, Racine pdf gratuit | T |
| Philosophie | livre de philosophie pdf, Platon pdf, Descartes discours de la méthode pdf | T |
| Histoire | livre d'histoire pdf gratuit, histoire de France pdf | T |
| Religion / spiritualité | livre religieux pdf, spiritualité pdf gratuit | T |
| Développement personnel | développement personnel pdf gratuit, livre motivation pdf | T (peu de domaine public : cibler les classiques, ex. Marc Aurèle, Sénèque) |
| Sciences | livre de sciences pdf, Darwin pdf, Poincaré pdf | T |
| Jeunesse / contes | contes pdf gratuit, Perrault pdf, fables de La Fontaine pdf | T |
| Informatique | livre informatique pdf gratuit | T (rare en domaine public : à couvrir via le blog plutôt que le catalogue) |

---

## العربية (ar, /ar/…)

### Principaux
| Mot-clé | Intention | Page cible |
|---|---|---|
| كتب pdf مجانا | T | /ar |
| تحميل كتب pdf مجانا | T | /ar |
| كتاب pdf مجانا | T | /ar |
| مكتبة كتب pdf | N/T | /ar/catalog |
| قراءة كتب اون لاين مجانا | T | /ar/catalog |
| كتب صوتية مجانية | T | /ar/audiobooks |
| روايات pdf | T | /ar/category/romans |

### Longue traîne
- `تحميل كتاب [العنوان] pdf` / `كتاب [العنوان] pdf مجانا` (T) → fiche livre
- `كتب [المؤلف] pdf` / `جميع كتب [المؤلف] pdf` (N/T) → page auteur
- `رواية [العنوان] pdf` (T) → fiche livre
- `ملخص كتاب [العنوان]` (I) → fiche livre (section « À propos »)
- `[العنوان] كتاب صوتي` (T) → fiche livre audio

### Par catégorie
| Catégorie | Mots-clés | Intention |
|---|---|---|
| روايات | روايات pdf، روايات عالمية مترجمة pdf، روايات كلاسيكية pdf | T |
| كتب دينية | كتب دينية pdf، كتب إسلامية pdf مجانا، تفسير pdf | T |
| تاريخ | كتب تاريخ pdf، تاريخ الأندلس pdf، تاريخ المغرب pdf | T |
| فلسفة | كتب فلسفة pdf، ابن رشد pdf، ابن خلدون المقدمة pdf | T |
| شعر | دواوين شعر pdf، المتنبي pdf، الشعر الجاهلي pdf | T |
| تنمية بشرية | كتب تنمية بشرية pdf مجانا، تطوير الذات pdf | T |
| علوم | كتب علمية pdf، ابن سينا pdf | T |
| أطفال | قصص أطفال pdf، حكايات pdf | T |
| برمجة | كتب برمجة pdf بالعربي | T (via blog) |

> Les titres arabes ne produisent pas de slug (le slug est en ASCII) : l'identifiant de la source est utilisé.
> Le `<title>` et la description restent en arabe, ce qui compte pour le classement.

---

## English (en, /en/…, also `x-default`)

### Main
| Keyword | Intent | Target |
|---|---|---|
| free pdf books | T | /en |
| free ebooks download | T | /en |
| download books pdf free | T | /en |
| public domain books | N/I | /en |
| read books online free | T | /en/catalog |
| free audiobooks | T | /en/audiobooks |
| classic books pdf | T | /en/catalog |

### Long tail
- `[title] pdf` / `free [title] pdf download` / `[title] pdf free` (T) → book page
- `[author] pdf` / `[author] books pdf` / `[author] complete works pdf` (N/T) → author page
- `[title] by [author] pdf` (N) → book page
- `[title] summary` (I) → book page
- `[title] audiobook free` (T) → audiobook page
- `[title] epub` (T) → book page

### By category
| Category | Keywords |
|---|---|
| Novels | classic novels pdf, free novels pdf, romance novels pdf free |
| Philosophy | philosophy books pdf, Plato pdf, Nietzsche pdf |
| History | history books pdf free, ancient history pdf |
| Religion | religious books pdf, spirituality pdf |
| Self-help | self help books pdf free, stoicism pdf, Meditations Marcus Aurelius pdf |
| Poetry | poetry books pdf, Shakespeare sonnets pdf |
| Science | science books pdf free, Darwin Origin of Species pdf |
| Children | children's books pdf free, fairy tales pdf |
| Programming | programming books pdf free (blog) |

---

## Español (es) — résumé
libros pdf gratis · descargar libros pdf gratis · `[título] pdf gratis` · `libros de [autor] pdf` · novelas clásicas pdf · audiolibros gratis.
Les 8 autres langues (de, it, pt, nl, ru, tr, zh, ja) suivent le même schéma ; leurs suffixes de titre sont dans `src/i18n/seo-messages.ts`.

---

## Structure Hn de la fiche livre (en place)

```
H1  {Titre du livre}
    (sous-titre : auteur, langue, pages, téléchargements ; boutons Lire / Télécharger PDF / EPUB)
H2  À propos            → description de la source ou description générée (voir gabarit)
H2  Écouter en ligne    → (livres audio uniquement)
H2  L'auteur
    H3  {Nom de l'auteur} → bio Wikipédia dans la langue de la page + lien « Voir tous ses livres »
H2  Du même auteur      → 4 livres (maillage auteur)
H2  Plus de {genre}     → 4 livres de la même catégorie (maillage catégorie)
H2  Avis
H2  Lire ou télécharger → (colonne) formats disponibles
H2  Infos du fichier    → langue, pages, taille du PDF, année, éditeur, ISBN
H2  Livres similaires   → 4 livres (catégories communes)
```
Fil d'Ariane visible + BreadcrumbList : Accueil › Catalogue › {Catégorie} › {Titre}.

## Gabarit de description auto-générée (quand la source est vide ou technique)

Construit dans `src/lib/book-description.ts` à partir des métadonnées, dans la langue de la page :

```
« {Titre} » de {Auteur}. Livre du domaine public à lire en ligne ou à télécharger gratuitement ({formats}).
Genre : {genre} · Langue : {langue} · Publication : {année} · Pages : {pages}.
```
Meta description (≤ 160 car.) = début du texte coupé à la fin d'une phrase + CTA :
`… Téléchargez le PDF gratuitement ou lisez-le en ligne, sans inscription.`

Chaque fiche diffère par son titre, son auteur, son genre, sa langue, son année et son nombre de pages, ce qui évite le
contenu dupliqué entre fiches. Les notes techniques d'Internet Archive (« digitized by… », « Brittle Books digitization
program », dimensions en cm…) sont détectées et remplacées automatiquement.

## Maillage interne (en place)
- Fiche livre → auteur (lien + bloc « Du même auteur »), catégorie (fil d'Ariane + « Plus de {genre} »), livres similaires.
- Page auteur → toutes ses fiches (paginées), catégories.
- Catégorie → fiches (paginées, pages 1–5 indexées), FAQ, catalogue.
- Accueil → sélection, catégories, collections, « Surprenez-moi ».
- Sitemap : toutes les fiches, auteurs, catégories, collections, dans les 12 langues.
