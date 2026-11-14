# DESIGN.md — Livres PDF Gratuits « Riad de papier »

> Produit avec open-design (nexu-io/open-design) : skill `redesign-skill` (audit → corrections),
> design system de base `kami` (papier chaud, un seul accent encre, hiérarchie portée par le serif),
> adapté à l'identité de marque navy `#14213D` + orange `#FCA311` et aux motifs zellige.

## Atmosphère
Une bibliothèque de riad : papier crème, encre bleu nuit, une touche d'or (orange de marque)
réservée aux moments forts. Les bandeaux navy encadrent la page (héros en haut, appel + pied de
page en bas), le corps reste sur papier. Le zellige reste la signature, discret (≤ 12 % d'opacité).

## Couleurs
| Rôle | Valeur | Usage |
|---|---|---|
| Navy (accent primaire) | `#14213D` | héros, CTA, liens, onglet actif, pied de page |
| Navy 2 | `#1F2F55` | survols sur fond navy, bordures sur navy |
| Or (accent de marque) | `#FCA311` | CTA sur fond navy, étoiles, soulignés, puces. Jamais en texte sur crème |
| Orange texte | `#B45F06` | eyebrows et catégories (contraste AA sur crème) |
| Papier | `#F7F2E8` | fond de page (jamais `#fff` en grand aplat) |
| Ivoire | `#FFFCF6` | cartes et champs |
| Sable | `#EFE6D4` | tuiles, bandeaux secondaires |
| Encre | `#1A1A2E` | texte principal (teinté navy, jamais `#000`) |
| Muted | `#5B5648` | texte secondaire |
| Ligne | `#E5DCCB` | séparateurs |

Ombres teintées navy (`rgba(20,33,61,…)`), une seule direction de lumière (du haut).

## Typographie
- Titres : Source Serif 4 (500/600) + Amiri pour l'arabe — `--ma-serif`.
- Interface : Geist (remplace Inter dans le design public ; l'admin garde Inter).
- Titres > 40 px : interlettrage −0.025em, `text-wrap: balance` ; paragraphes `text-wrap: pretty`, ≤ 65 ch.
- Chiffres : `tabular-nums`.
- Eyebrows : petite étoile à 8 branches en or + casse normale en petites capitales.

## Composants
- Boutons : rayon 12 px, survol (teinte + translation −1 px), appui `scale(.98)`, transition 200 ms.
- Cartes : pas de bordure + ombre génériques ; fond sable ou ivoire, bordure seulement quand utile.
- Couvertures : relief au survol (translation −4 px + ombre plus longue).
- Rayons variés : 8 px (intérieur), 14 px (contrôles), 24–28 px (conteneurs).

## Mouvement
Entrée échelonnée des étagères et grilles (opacité + translation Y), désactivée avec
`prefers-reduced-motion`. Uniquement `transform`/`opacity`.

## RTL
Propriétés logiques (`margin-inline`, `inset-inline`, `text-align: start`) pour tout ce qui est
latéralisé ; `dir="auto"` conservé sur les titres et auteurs.
