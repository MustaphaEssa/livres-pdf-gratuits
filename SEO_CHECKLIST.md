# SEO — checklist des actions manuelles

Ce qui est automatique (code) et ce qu'il reste à faire à la main.

## Déjà en place dans le code (aucune action requise)

| Élément | Où |
|---|---|
| `<title>` / meta description uniques par page et par langue | `src/lib/seo.ts`, `src/i18n/seo-messages.ts`, `generateMetadata` de chaque page |
| Fiche livre : `{Titre} - {Auteur} \| Télécharger PDF gratuit` (≤ 60 car., traduit dans les 12 langues) | `src/app/livre/[slug]/page.tsx` |
| Meta description ≤ 160 car. terminée par un appel à l'action | `descriptionWithCta()` dans `src/lib/seo.ts` |
| Canonical absolue + hreflang (12 langues + `x-default` = anglais) | `src/i18n/seo.ts` |
| `<html lang>` et `dir="rtl"` pour l'arabe | `src/app/layout.tsx` |
| Open Graph + Twitter Card corrects sur chaque page (avant : og:url = accueil partout) | `pageMetadata()` |
| Image OG 1200×630 générée par livre (couverture + titre) | `src/app/og/livre/[slug]/route.tsx` |
| Image OG par défaut (`/og-image.png`, manquante avant → 404) | `src/app/og-image.png/route.tsx` |
| JSON-LD : Book (+ offre gratuite, format, genre, pages, ISBN), BreadcrumbList, WebSite + SearchAction, Organization, ItemList, Person, FAQPage (catégories) | pages + `src/components/seo/json-ld.tsx` |
| `noindex,follow` : recherche interne, filtres, tri, pagination > page 5, catégorie vide | `MAX_INDEXED_PAGE` dans `src/lib/seo.ts` |
| Sitemap index `/sitemap.xml` → `/sitemaps/{langue}-{n}.xml`, chaque version linguistique listée avec ses alternates, `lastmod`, découpage auto à 40 000 URLs | `src/lib/sitemap.ts` |
| `robots.txt` : bloque /admin, /api, compte, téléchargement forcé, livre au hasard, `?q=`, `?sort=` | `src/app/robots.ts` |
| PDF/EPUB : en-tête `Link: rel="canonical"` vers la fiche HTML (les signaux vont à la fiche) | `src/app/livre/[slug]/pdf/route.ts`, `src/app/uploads/[...path]/route.ts` |
| Slug `titre-auteur` unique pour les nouveaux imports (anciens slugs inchangés pour ne pas casser l'indexation) | `bookSlug()` dans `src/lib/utils.ts` |
| Description de secours unique (titre, auteur, genre, langue, année, pages, formats) quand celle de la source est vide ou technique | `src/lib/book-description.ts` |

> Choix assumé : le français reste **sans préfixe** (`/livre/x`) et `/fr/...` redirige en 308 vers cette adresse.
> Passer à `/fr/...` changerait les ~2 200 URL déjà indexées. Google n'exige pas de préfixe pour la langue par défaut,
> tant que le hreflang est complet, ce qui est le cas.

## À faire après le déploiement

### 1. Déployer et vérifier (5 min)
- [ ] Déployer sur le VPS, puis ouvrir :
  - `https://livrespdfgratuits.com/sitemap.xml` (12 fichiers listés)
  - `https://livrespdfgratuits.com/sitemaps/fr-0.xml` et `.../ar-0.xml`
  - `https://livrespdfgratuits.com/robots.txt`
  - `https://livrespdfgratuits.com/og-image.png` et `https://livrespdfgratuits.com/og/livre/<un-slug>` (images 1200×630)
- [ ] Nginx : si `/uploads/` est servi directement par Nginx (sans passer par Next), ajouter l'en-tête canonical sur les PDF :
  ```nginx
  location ~ ^/uploads/books/(?<slug>[^/]+)\.(pdf|epub)$ {
      add_header Link "<https://livrespdfgratuits.com/livre/$slug>; rel=\"canonical\"";
      # … reste de la config existante
  }
  ```
- [ ] Cloudflare : règle de cache « Cache Everything » sur `/uploads/*`, `/og/*`, `/og-image.png` et `/_next/static/*` ; **ne pas** mettre en cache le HTML (pages dépendantes de la langue/du cookie).

### 2. Google Search Console
- [x] Propriété domaine vérifiée (déjà fait).
- [ ] **Sitemaps** → supprimer l'ancien `sitemap.xml` puis le soumettre à nouveau (c'est désormais un index) pour forcer la relecture.
- [ ] **Inspection d'URL** → tester une fiche livre FR, une EN, une AR : vérifier « Page indexable », canonical choisie par Google = canonical déclarée.
- [ ] **Résultats enrichis** → tester une fiche livre et une catégorie sur https://search.google.com/test/rich-results (Book, BreadcrumbList, FAQPage).
- [ ] **Paramètres internationaux** : rien à régler (hreflang lu automatiquement) ; surveiller le rapport « Pages » pour les erreurs hreflang.
- [ ] Demander l'indexation des 10–20 fiches les plus importantes (bouton « Demander une indexation »).

### 3. Bing Webmaster Tools
- [ ] https://www.bing.com/webmasters → « Importer depuis Google Search Console » (le plus rapide : récupère site + sitemap).
- [ ] Sinon : ajouter le site, vérifier par DNS (CNAME) ou balise, soumettre `https://livrespdfgratuits.com/sitemap.xml`.
- [ ] Activer **IndexNow** dans Bing (Paramètres → IndexNow) : Bing, Yandex et Seznam indexent alors les nouveaux livres en quelques heures.

### 4. Suivi de l'indexation (chaque semaine)
- [ ] GSC → Pages : nombre de pages indexées vs « Explorée, actuellement non indexée ». Si ce dernier grossit sur les fiches livres : enrichir les descriptions des fiches concernées (contenu jugé trop pauvre).
- [ ] GSC → Performances : filtrer les requêtes contenant `pdf`, `télécharger`, `gratuit`, `تحميل`, `free` ; repérer les pages en position 8–20 et les renforcer (description, maillage depuis la page d'accueil ou une collection).
- [ ] Vérifier que les pages `?page=6+`, `?q=` restent **exclues** (« Exclue par la balise noindex ») : c'est voulu.
- [ ] Core Web Vitals (GSC → Signaux Web essentiels) : LCP < 2,5 s, CLS < 0,1, INP < 200 ms.

### 5. Contenu (en continu)
- [ ] Écrire une description éditoriale (≥ 120 caractères) pour chaque **catégorie** dans l'admin : elle remplace la meta générée en français.
- [ ] Pour les 100 livres les plus vus : vérifier que la description n'est pas une note technique d'Internet Archive.
- [ ] Publier 2–4 articles de blog par mois ciblant la longue traîne (« meilleurs romans classiques à lire gratuitement », « livres de philosophie pour débutants PDF ») avec liens vers les fiches.
- [ ] Créer des **collections** thématiques (elles sont dans le sitemap et en hreflang) : « Classiques du bac », « Littérature arabe classique », etc.

### 6. Netlinking (hors site)
- [ ] Inscription dans les annuaires de bibliothèques numériques et de ressources éducatives libres.
- [ ] Profils de la marque (Facebook, X, Pinterest : les couvertures marchent bien sur Pinterest), avec lien vers le site.
- [ ] Partenariats avec des blogs de lecture / enseignants (l'app ProfChrono peut renvoyer vers le site).
