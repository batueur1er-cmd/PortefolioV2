---
name: moteur-doom
description: Modifier la démo façon Doom du portfolio (features/doom) — le niveau (secteurs, hauteurs, lumière, objets), les textures et les sprites, le rendu (arbre BSP, murs en colonnes, visplanes, sprites), le joueur, la carte 2D, le rendu au ralenti ou les textes d'explication — sans casser la copie de la loupe ni l'architecture du moteur. À utiliser dès qu'on parle de Doom, du « jeu 3D », du niveau, du BSP, d'une texture, d'un sprite, de la carte 2D ou de la démo /projets/doom/demo.
---

# Le moteur façon Doom

La démo `/projets/doom/demo` dessine un petit niveau original avec la méthode du moteur de Doom
(1993) : arbre BSP parcouru de l'avant vers l'arrière, murs peints en colonnes, sols et plafonds en
visplanes, sprites triés du plus loin au plus proche, palette de 256 couleurs et tables d'ombre.
Pas de Three.js ni de WebGL : chaque pixel est calculé dans un canvas de 320 × 200.

## L'architecture

```
features/doom/
├── doom-page.*        la page : clavier, souris, carte, ralenti, lien avec la loupe (sync)
├── data/              état de la page : DOOM_PATH, phases du ralenti, compteurs, DoomSession
├── ui/                présentation seule : doom-controls (pavé, ralenti, compteurs), doom-steps (explications)
└── engine/            le moteur, en TypeScript pur
    ├── engine.ts      la façade : la seule porte d'entrée pour le reste du site
    ├── level/         le niveau (comme un WAD) : level-data (ce qu'on dessine), map-compiler, node-builder, level
    ├── color/         palette (PLAYPAL), tables d'ombre (COLORMAP) et de lumière
    ├── graphics/      images : walls, flats, sky, sprites (patches en « posts »)
    ├── render/        une image : bsp (r_bsp), segs (r_segs), planes (r_plane), things (r_things),
    │                  draw (r_draw), renderer (r_main), screen (couleurs ou rayons X)
    ├── play/          le joueur : physics (valeurs de Doom), collision, player
    └── automap/       la carte vue de dessus
```

`scripts/check-architecture.mjs` (constante `PURE_MODULES`) vérifie avant chaque `npm test` que :
- le moteur n'importe ni Angular, ni paquet npm, ni rien hors de `engine/` ;
- chaque module ne dépend que de ceux listés (`level` et `color` de rien, `graphics` → color, level ;
  `render` → color, graphics, level ; `play` → level ; `automap` → level, render) ;
- la page, `data/` et `ui/` ne passent que par `engine/engine.ts`.
Un nouveau dossier dans `engine/` se déclare d'abord dans `PURE_MODULES`.

## Modifier le niveau

Tout est dans `engine/level/level-data.ts`, en unités de Doom (joueur : 56 de haut, 32 de large,
yeux à 41, marche de 24 au plus).
- Un secteur = un contour (`rect()` ou une liste de points) ; les trous (`holes`) sont des piliers,
  ou la place d'un autre secteur posé dedans. L'orientation est corrigée toute seule.
- Deux secteurs qui se touchent partagent une arête : elle devient une ouverture. Les sommets posés
  sur une arête la coupent automatiquement ; deux secteurs qui se recouvrent lèvent « Carte invalide ».
- `ceilingFlat: null` : le ciel. `dimLight` : une lumière qui vacille. `lower` : la contremarche d'une marche.
- Un point `[x, y, 'logo']` change la texture du mur qui part de ce point.
- Un objet `hidden: true` (avec `floor`) se pose hors des secteurs, dans l'épaisseur d'un mur, comme
  le coffre derrière le mur nord du hall : le rendu normal ne le voit jamais ; aux rayons X, il est
  peint par-dessus l'image finie (`Things.drawHidden`) et la carte le montre. Il ne compte pas dans
  les opérations du rendu, pour que le ralenti reste identique dans les deux fenêtres.
- Après un changement, vérifie `level/level.spec.ts` (pièces attendues aux bons endroits).

## Les portes

Un secteur avec `door: <texture>` est une porte : `ceiling` égal à `floor` au départ, et tout le reste
du niveau inchangé. `play/doors.ts` fait monter le plafond (seule hauteur mutable du niveau) ; les
hauteurs partent dans `View.doors` et `DoomPresence.doors`. Elles ne bougent pas pendant le ralenti.

## Textures et sprites

- Couleurs : uniquement `ink(RAMP.X, nuance)` (16 teintes du thème × 16 nuances, 0 clair, 3 pur,
  15 presque noir). Aucune couleur en dur : les teintes viennent des variables CSS (`RAMP_COLORS`).
- Murs : largeur et hauteur en puissances de 2, rangés en colonnes. Sols : 64 × 64.
- Sprites : dessinés dans un `Bitmap`, puis `toPatch(leftOffset, topOffset)` ; 8 images pour un
  objet vu sous 8 angles, plusieurs `frames` pour une animation (`ticsPerFrame`).
- Rien d'aléatoire : `hash()` / `grain()` de `graphics/noise.ts`, sinon la loupe verrait autre chose.

## Le champ de vision

`View.fov` (en degrés, 60 à 120, 90 par défaut comme Doom) fixe la focale (`focalOf` dans
`render/render.model.ts`) : `Frame` en tire `focal`, `tanHalf`, `fovHalf` et l'angle de chaque
colonne. Aucune passe du rendu n'utilise de focale en dur : lis toujours `f.focal`. Les tables de
lumière restent calées sur la distance (`f.lightRatio`), pas sur le grossissement. Le curseur de
`doom-controls` change le champ ; la valeur part dans `DoomPresence.fov` pour la loupe, et la carte
ouvre le cône du joueur d'autant.

## La loupe

La copie ne calcule rien d'elle-même : elle reçoit `DoomPresence` (position, angle, horloge des
effets, ralenti, BSP affiché) à chaque image par `DoomPage.sync`. Tout ce qui change l'image doit
donc passer par cette présence et rester déterministe (pas de `Math.random`, pas de `Date.now`).
Les textes en clair et leur pendant technique partagent la même case (`.say` avec `.plain` et
`.tech`) : la mise en page ne bouge jamais aux rayons X.

## Les textes

Les explications citent le vrai fonctionnement de Doom (noms de fonctions, limites comme 128
visplanes) : seulement des faits sûrs. Le niveau, les textures et les objets restent originaux ;
ne reproduis ni les niveaux, ni les images, ni les monstres de Doom.

## Vérifier

1. `npm test -- --watch=false` (règles d'architecture comprises) et `npx ng build`.
2. Dans le navigateur : se déplacer, monter l'escalier, regarder la cour par la fenêtre du balcon,
   lancer le ralenti, puis la loupe simulée (skill `verifier-le-portfolio`) sur la démo.
