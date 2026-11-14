# DESIGN.md — Livres PDF Gratuits

Source de vérité visuelle du site. Basée sur le design system **kami** d'[open-design](https://github.com/nexu-io/open-design)
(`design-systems/kami`), adaptée à une bibliothèque en ligne multilingue (FR · EN · AR).
Implémentation : `src/app/design.css` (scopé sous `.ma`) et `@theme` dans `src/app/globals.css`.

## Ambiance

« Du bon texte sur du bon papier. » Fond parchemin chaud, un seul accent (encre bleue),
hiérarchie portée par le serif, gris chauds uniquement, ombres très douces. Le site doit
ressembler à une belle édition imprimée, pas à un tableau de bord.

## Couleurs

| Rôle | Token | Valeur |
|---|---|---|
| Fond de page (parchemin) | `--paper` | `#f5f4ed` |
| Cartes, en-tête, champs (ivoire) | `--surface` | `#faf9f5` |
| Bandes, boutons secondaires (sable) | `--sand` | `#ebe8dd` |
| Bordure / bordure forte | `--line` / `--line-strong` | `#e3e0d4` / `#d5d1c3` |
| Texte principal | `--ink` | `#141413` |
| Texte secondaire | `--ink-2` | `#3d3d3a` |
| Sous-texte | `--muted` | `#504e49` |
| Métadonnées | `--meta` | `#6b6a64` |
| **Accent unique (encre bleue)** | `--accent` | `#1b365d` (survol `#142a49`) |
| Teinte d'accent (tags, pastilles) | `--accent-tint` | `#e4ecf5` |
| Étoiles de notation | `--star` | `#e0a33a` |
| Orange de marque | `--brand-orange` | `#fca311` (logo uniquement) |

Règles : jamais `#ffffff` en fond, jamais `#000000`, aucun gris froid (`slate-*`),
pas de second accent saturé. L'encre bleue reste sous ~5 % de la surface (boutons
principaux, liens, état actif, chiffres clés). Pas de dégradés.

## Typographie

- **Serif** (`--ma-serif`) : Source Serif 4 → Amiri (arabe) → Charter → Georgia.
  Titres, chapô (`.lead`), résumés (`.prose`), titres de livres. Graisses **400 et 500 seulement**.
- **Sans** (`--font-sans`) : Inter pour l'interface (boutons, filtres, libellés).
- Pas d'italique : l'emphase passe par la couleur d'accent.
- Titres : interlignage 1.04–1.2, approche négative (−0.02 à −0.03em), `text-wrap: balance`.
- Surtitres : 12px, majuscules, approche +0.12em, couleur `--meta`.
- Chiffres empilés (stats, classements, fiches) : `font-variant-numeric: tabular-nums`.
- Texte long : 68ch max, interlignage 1.5–1.6.

## Profondeur et formes

- Ombres : `--whisper` (`0 4px 24px rgba(60,52,30,.06)`) pour les cartes, `--lift` au survol.
  Teinte chaude, lumière venant du haut. Pas d'ombres dures décalées.
- Rayons : `--radius-sm` 8px (éléments internes), `--radius` 12px (cartes), 20px (grands blocs),
  999px (pastilles, onglets).

## Interaction

- Transitions de 150 à 300 ms (`--ease`) sur tous les éléments interactifs.
- Appui : `translateY(1px) scale(.98)`. Survol des couvertures : léger soulèvement.
- Focus visible : contour de 3px en `--accent`. Respect de `prefers-reduced-motion`.
- Pas de section sombre isolée dans une page claire (le bandeau d'appel à l'action est en sable).

## Identité

Les motifs géométriques marocains (`patterns.tsx`, arches) restent, mais très discrets
(opacité 0.06) : ils servent de filigrane, pas de décor.
