# Portfolio v2 — Révélateur

Le portfolio de Baptiste Nodon, en Angular 21. Il a une face cachée : une **loupe** révèle une
version « rayons X » de la page (coulisses, schémas, calculs en direct) et une chasse aux secrets.

## Lancer le projet

```bash
npm install
npm start
```

Ouvre <http://localhost:4200>.

```bash
npm test             # règles d'architecture + tests unitaires (Vitest)
npm run lint:archi   # règles d'architecture seules
npm run build        # build de production dans dist/portfolio-v2/browser
```

## La loupe : aucun bouton

1. Ouvre le site dans **une seconde fenêtre** (glisse l'onglet hors du navigateur).
2. **Rétrécis-la** sous 680 × 620 px : elle comprend toute seule qu'elle est une loupe.
3. **Pose-la** par-dessus le portfolio : elle montre exactement ce qui se trouve dessous, aux rayons X.

Agrandis-la de nouveau et elle redevient un portfolio. Dans la loupe : molette pour faire défiler
le portfolio d'en dessous, Maj + molette (ou `+` / `-` / `0`) pour zoomer, `M` pour le compteur
Geiger sonore. Un secret est trouvé quand il reste un court instant sous le réticule.

La loupe n'existe que dans une autre fenêtre du navigateur, et aucun bouton ne la montre : c'est au
visiteur de faire la manœuvre. Le seul bouton flottant est le **mode nuit**. Tous les secrets trouvés,
la **singularité** s'ouvre d'elle-même (chaque fenêtre devient un trou noir) ; le code Konami l'ouvre
directement. `?loupe` ou `?portfolio` dans l'URL imposent un rôle (démonstration, tests).

## Architecture

Le code est découpé en couches ; chaque couche ne dépend que de celles du dessous. La règle est
vérifiée par `scripts/check-architecture.mjs`, lancé avant chaque `npm test`.

```
src/app/
├── core/       infrastructure : géométrie, DOM, horloge, thème, synchronisation des fenêtres
├── domain/     le profil et ses calculs (parcours, carte, frise, graphe de compétences)
├── shared/     briques d'interface et de mouvement, sans métier
├── features/   une fonctionnalité par dossier
│   ├── page/         la page portfolio et ses sections (hero, profil, parcours…)
│   ├── secrets/      catalogue, progression, directive appSecret, notification
│   ├── lens/         rôle de la fenêtre, vue loupe, HUD, halos
│   └── singularity/  l'écran final
└── shell/      assemble le tout : bascule portfolio ↔ loupe, bouton mode nuit, curseur
```

| Couche | Peut importer |
| --- | --- |
| `core` | `core` |
| `domain` | `core`, `domain` |
| `shared` | `core`, `shared` |
| `features/x` | `core`, `domain`, `shared`, `x`, et les fonctionnalités listées dans `FEATURE_DEPS` |
| `shell` | tout |

Les fonctionnalités ne se connaissent que dans un sens : `lens → page → secrets`. Quand une couche
basse a besoin de quelque chose d'une couche haute, elle déclare un contrat et la couche haute le
fournit : `SecretHost` (secrets) et `ScrollStage` (shared) sont implémentés par `PortfolioPage`.
Les imports entre couches passent par les alias `@core`, `@domain`, `@shared`, `@features`.

## Comment ça marche

- **Deux exemplaires de la même page.** `PortfolioPage` est rendue en surface dans la fenêtre
  portfolio et en rayons X dans la loupe. Le mode rayons X ne change que des couleurs, des contours
  et des opacités, jamais la mise en page : les deux exemplaires restent identiques au pixel près.
  Les tailles s'appuient sur des container queries (`cqi`) et sur `--vh`, la hauteur de la fenêtre
  portfolio, pour ne jamais dépendre de la taille de la loupe.
- **Le rôle de chaque fenêtre.** Chaque fenêtre annonce sur un `BroadcastChannel` sa position, sa
  taille, son défilement et si elle est « petite » (`core/sync`). Une fenêtre petite, alors qu'une
  grande fenêtre du site est ouverte, devient une loupe (`features/lens/data/window-role.store.ts`).
  Une marge de sortie et un court délai évitent les bascules en plein redimensionnement.
- **Des animations identiques partout.** Les animations liées au défilement (apparitions, frise qui
  se remplit, mots qui s'allument, navigation) lisent le défilement de la *scène* (`ScrollStage`)
  et non celui de `window` : la loupe reçoit celui du portfolio et calcule la même chose. Les
  animations en boucle sont calées sur l'horloge de la machine (`clockDelay`) : deux fenêtres
  ouvertes à des moments différents les montrent au même instant de leur cycle.
- **Secrets.** La directive `appSecret` enregistre chaque élément caché ; la loupe mesure leur
  recouvrement et `ScanEngine` impose un temps d'analyse. Les secrets trouvés sont partagés entre
  fenêtres (localStorage + bus).
- **Zoneless.** Pas de zone.js : l'état passe par des signaux, et la boucle d'animation unique
  (`core/dom/frame-loop.ts`) écrit directement dans le DOM.
- **Chargement à la demande.** Le shell est une route chargée paresseusement ; la vue loupe et la
  singularité sont des blocs `@defer`.

## Modifier le contenu

Tout le texte est dans [`src/app/domain/profile/profile.data.ts`](src/app/domain/profile/profile.data.ts) :
titres des sections, parcours, réalisations, compétences, formation, contact, et les coulisses
révélées par la loupe. Les compteurs (mois en entreprise, jours d'alternance, distances, frise,
graphe des compétences) sont recalculés à partir de ces données dans `domain/career`.

## Changer le style

Toutes les couleurs, typographies, rayons et ombres sont des variables CSS rangées dans
[`src/styles/themes/`](src/styles/themes/). Aucun composant ne contient de couleur en dur, et les
transparences sont calculées avec `color-mix()` à partir des couleurs de base.

- **Modifier le thème actuel** : édite [`_clair.scss`](src/styles/themes/_clair.scss) (couleurs de l'ancien portfolio : indigo et gris). Chaque
  variable y est commentée (fond, encre, accent, palette des rayons X, illustrations…).
- **Ajouter un thème** : copie `_nuit.scss` sous un autre nom, change le sélecteur
  `:root[data-theme='…']`, ajoute-le dans `index.scss` et dans
  [`core/theme/themes.ts`](src/app/core/theme/themes.ts). Le bouton « Mode nuit » bascule entre `clair` et `nuit`.
- **Tester un thème** : `http://localhost:4200/?theme=nuit` force un thème sans l'enregistrer.
- **Changer de police** : installe-la avec Fontsource, ajoute son CSS dans `angular.json`
  (`styles`), puis modifie `--serif`, `--sans`, `--mono` ou `--hand`.

Les styles globaux (reset, primitives de mise en page, mouvement, mécanique rayons X) sont dans
`src/styles/base/`. Le thème choisi est partagé avec la fenêtre loupe.

## Ajouter un secret

Déclare-le dans `src/app/features/secrets/data/secrets.catalog.ts`, puis pose `appSecret="son-id"`
sur un élément du gabarit, positionné en absolu dans un espace libre. Le test
`portfolio-page.spec.ts` vérifie que catalogue et gabarits restent synchronisés.

## Déploiement

Le build est statique : n'importe quel hébergement de fichiers convient. Toutes les fenêtres
chargent la même page, aucune réécriture d'URL n'est nécessaire.

## Limites

- Le zoom du navigateur doit être le même (idéalement 100 %) dans les deux fenêtres.
- La loupe doit être une vraie fenêtre (pas un onglet), sur le même écran que le portfolio.
- `BroadcastChannel` ne relie que des fenêtres de la même origine et du même navigateur.
