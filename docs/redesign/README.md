# Redesign « Riad de papier » (avec open-design)

Branche : `redesign/open-design`, partie du commit `2a1fe9f` (passe « kami » précédente).
Rien n'est déployé.

## Outil utilisé
[nexu-io/open-design](https://github.com/nexu-io/open-design), sous licence Apache-2.0, environ 107k étoiles, maintenu activement.
C'est un espace de design local (démon `od` + interface web), avec un serveur MCP, plus de 170 skills et 154 design systems.
- Installé hors du projet, dans `C:\Users\HP\tools\open-design` (`corepack pnpm install` ; le README demande
  Node 24, ici Node 22 : avertissement d'engine, mais le build est passé et `od --help` répond).
- `install.sh` n'est qu'un wrapper de `od mcp install <agent>`. Je n'ai pas enregistré le MCP dans la config
  Claude, car il demande que le démon tourne et ce n'était pas nécessaire ici.
- Ce qui a servi : le skill **`redesign-skill`** (scan → audit → corrections ciblées, sans réécrire la stack)
  et le design system **`kami`** (papier chaud, accent encre, serif), adaptés à la marque navy + or.

## Ce qui change
Les changements portent surtout sur la feuille `src/app/design.css` (scopée `.ma`) : le balisage, les routes,
le contenu et le JSON-LD ne bougent pas.
- **Marque restaurée** : navy `#14213D` + or `#FCA311`. La passe « kami » avait réduit l'orange au seul logo
  et rendu le zellige presque invisible.
- **Bandeaux navy qui encadrent la page** : héros de l'accueil, héros de la fiche livre, appel « Collections » et
  pied de page. Le zellige y est en or (8–12 %), avec une arche dorée derrière les couvertures.
- **Typo** : Source Serif 4 (titres, 500/600 + italique pour l'emphase du héros) et Geist pour l'interface du site
  public (l'admin garde Inter). `--ma-serif` est défini sur `.ma` (corrige les titres affichés en Amiri/Inter).
- **États** : survol et appui sur les boutons, couvertures qui se soulèvent, tuiles de genre qui passent au
  navy, flèches animées, focus en or, liens soulignés en or.
- **Mouvement** : entrée échelonnée du héros et des grilles (propriété `translate`, désactivée avec
  `prefers-reduced-motion`).
- **Composants** : onglets en contrôle segmenté, badges carrés, eyebrows avec étoile à 8 branches, filtres
  du catalogue en panneau sable, cartes de téléchargement filetées d'or, tuiles de données groupées, chiffres tabulaires.
- **Mobile** : en-tête collant translucide sur une seule ligne, barre d'onglets avec indicateur doré, étagère
  `scroll-padding`, correction du vide dans les filtres du catalogue (`flex-basis` en colonne).
- **Accessibilité** : lien « Aller au contenu » (`#contenu` sur chaque `<main>` public).
- **RTL** : propriétés logiques (`inset-inline`, `margin-inline`, `text-align: start`), flèches retournées
  en `dir="rtl"`. `dir="auto"` et les couvertures `.is-rtl` sont conservés.
- `globals.css` est revenu à la version navy d'origine (le `@theme` Tailwind touche aussi l'admin, hors périmètre).
- L'emplacement de l'ancien bandeau de stats reste vide (réservé à la pub).

## Captures
`avant/` = `main` au commit `2a1fe9f`, `apres/` = cette branche. Desktop 1440 px, mobile 390 px
(capturé via une iframe de 390 px, car Edge headless impose environ 500 px de large minimum).
Pages : accueil, catalogue, fiche « Les Misérables ».
