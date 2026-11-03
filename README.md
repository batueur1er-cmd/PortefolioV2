# Portfolio v2 — Révélateur

Le portfolio de Baptiste Nodon, en Angular 21. Il a une face cachée : une **loupe** révèle une
version « rayons X » de la page (coulisses, schémas, calculs en direct) et une chasse aux secrets.

## Lancer le projet

```bash
npm install
npm start
```

Ouvre <http://localhost:4200>, puis clique sur **« ◎ Ouvrir la loupe »** : une petite fenêtre
s'ouvre. Pose-la par-dessus le portfolio, elle montre exactement ce qui se trouve dessous, aux
rayons X.

```bash
npm test        # tests unitaires (Vitest)
npm run build   # build de production dans dist/portfolio-v2/browser
```

## Les trois façons de percer la page

| Mode | Comment | Les secrets comptent ? |
| --- | --- | --- |
| Loupe fenêtre | bouton « Ouvrir la loupe », puis glisser la fenêtre sur le portfolio | oui |
| Loupe intégrée | bouton « Loupe intégrée » : un cercle qui suit la souris (ou le doigt) | oui |
| Rayons X | bouton « Rayons X » : toute la page d'un coup | non |

Dans la fenêtre loupe : molette pour faire défiler le portfolio d'en dessous, Maj + molette
(ou `+` / `-` / `0`) pour zoomer, `M` pour le compteur Geiger sonore. Un secret est trouvé
quand il reste un court instant sous la loupe. Tous trouvés, la **singularité** se débloque
(l'Effet 1 : chaque fenêtre devient un trou noir et elles s'échangent de la lumière). Le code
Konami l'ouvre directement.

## Comment ça marche

- **Deux exemplaires de la même page.** `PortfolioPage` est rendue en surface dans la fenêtre
  principale et en rayons X dans la loupe. Le mode rayons X ne change que des couleurs, des
  contours et des opacités, jamais la mise en page : les deux exemplaires restent identiques au
  pixel près. Les tailles s'appuient sur des container queries (`cqi`) et sur `--vh`, la hauteur
  de la fenêtre portfolio, pour ne jamais dépendre de la taille de la loupe.
- **Synchronisation entre fenêtres.** Chaque fenêtre publie sa position écran, sa largeur et son
  défilement sur un `BroadcastChannel` (`core/presence-channel.ts`, `core/window-bus.ts`), à chaque
  image tant que quelque chose change. La loupe se cale sur la largeur du portfolio et se décale
  de l'écart entre les deux fenêtres (`lensTransform` dans `core/geometry.ts`).
- **Secrets.** La directive `appSecret` enregistre chaque élément caché ; la loupe mesure leur
  recouvrement (`coverage`, `circleCoverage`) et `ScanEngine` impose un temps d'analyse. Les
  secrets trouvés sont partagés entre fenêtres (localStorage + bus).
- **Zoneless.** Pas de zone.js : l'état passe par des signaux, et la boucle d'animation unique
  (`core/frame-loop.ts`) écrit directement dans le DOM sans relancer la détection de changements.
- **Chargement à la demande.** Les deux fenêtres sont des routes chargées paresseusement, et la
  singularité un bloc `@defer`.

## Modifier le contenu

Tout le texte est dans [`src/app/core/profile.data.ts`](src/app/core/profile.data.ts) : parcours,
réalisations, compétences, formation, contact, et les coulisses révélées par la loupe. Les
compteurs (mois en entreprise, jours d'alternance, distances sur la carte, graphe des
compétences) sont recalculés à partir de ces données.

## Changer le style

Toutes les couleurs, typographies, rayons et ombres sont des variables CSS rangées dans
[`src/styles/themes/`](src/styles/themes/). Aucun composant ne contient de couleur en dur, et les
transparences sont calculées avec `color-mix()` à partir des couleurs de base.

- **Modifier le thème actuel** : édite [`_papier.scss`](src/styles/themes/_papier.scss). Chaque
  variable y est commentée (fond, encre, accent, palette des rayons X, illustrations…).
- **Ajouter un thème** : copie `_nuit.scss` sous un autre nom, change le sélecteur
  `:root[data-theme='…']`, ajoute-le dans `index.scss` et dans
  [`core/themes.ts`](src/app/core/themes.ts). Il apparaît alors dans le bouton de thème du dock.
- **Tester un thème** : `http://localhost:4200/?theme=nuit` force un thème sans l'enregistrer.
- **Changer de police** : installe-la avec Fontsource, ajoute son CSS dans `angular.json`
  (`styles`), puis modifie `--serif`, `--sans`, `--mono` ou `--hand`.

Le thème choisi est enregistré et partagé avec la fenêtre loupe, qui doit afficher la même palette.
Après avoir modifié `angular.json`, relance `npm start`.

## Ajouter un secret

Pour ajouter un secret : déclare-le dans `src/app/core/secrets.catalog.ts`, puis pose
`appSecret="son-id"` sur un élément du gabarit, positionné en absolu dans un espace libre.
Le test `portfolio-page.spec.ts` vérifie que catalogue et gabarits restent synchronisés.

## Déploiement

Le build est statique : n'importe quel hébergement de fichiers convient. La loupe est la même
page ouverte avec `?loupe`, aucune réécriture d'URL n'est nécessaire.

## Limites

- Le zoom du navigateur doit être le même (idéalement 100 %) dans les deux fenêtres.
- La loupe doit être une vraie fenêtre (pas un onglet), sur le même écran que le portfolio.
- `BroadcastChannel` ne relie que des fenêtres de la même origine et du même navigateur.
