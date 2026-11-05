# Portfolio v2 — Révélateur

Le portfolio de Baptiste Nodon (apprenti développeur, Bachelor CPI au DIIAGE), en Angular 21
zoneless. Sa particularité : la page existe en deux exemplaires. Une seconde fenêtre du site,
rétrécie et posée sur la première, devient une **loupe à rayons X** qui révèle des coulisses et
une chasse aux secrets.

Réponds à Baptiste en français. Les textes du site et les commentaires de code sont en français.

## Commandes

```bash
npm start                  # serveur de dev sur http://localhost:4200
npm test -- --watch=false  # règles d'architecture, puis tests Vitest
npm run lint:archi         # règles d'architecture seules
npx ng build               # build de production (budgets dans angular.json)
```

Dans le navigateur intégré, le serveur se lance avec `preview_start` (configuration « portfolio »
de `.claude/launch.json`). Relance-le après toute modification d'`angular.json` ou de `tsconfig.json`.

## Règle des commits

Demandée par Baptiste, elle vaut pour toute la suite du projet :

- **À chaque fin d'intégration d'une feature**, fais un commit sans attendre qu'on le demande,
  une fois les tests et le build au vert.
- Le message commence par **une note très simple et humaine**, une phrase qui dit ce qui change
  comme on le raconterait à quelqu'un, sans préfixe ni jargon. Suit une ligne vide, puis **une
  liste de détails** concrets (3 à 8 puces), puis la ligne d'attribution habituelle.
- Tout se fait **directement sur `main`** (choix de Baptiste) : pas de branche de feature.
  Ne pousse pas sans qu'on te le demande.
- Le détail, avec des exemples : skill `commit-feature`.

## Architecture

```
src/app/
├── core/      infrastructure : dom/, geometry/, sync/ (bus entre fenêtres), theme/, time/
├── domain/    profile/ (contenu), career/, geo/, skills/ : TypeScript pur, testé
├── shared/    motion/ (apparitions, compteurs, effets) et ui/ (en-tête de section, bandeau…)
├── features/  page/ (la page et ses sections), secrets/, lens/ (loupe), singularity/
└── shell/     racine de chaque fenêtre : bascule portfolio ↔ loupe, bouton mode nuit, curseur
```

- `core` → `core` ; `domain` → `core`, `domain` ; `shared` → `core`, `shared` ;
  `features/x` → `core`, `domain`, `shared`, `x` et `FEATURE_DEPS[x]` ; `shell` → tout.
- `FEATURE_DEPS` (dans `scripts/check-architecture.mjs`) : `lens → page, secrets`,
  `page → secrets`, rien d'autre. Le script tourne avant chaque `npm test`.
- Une couche basse qui a besoin d'une couche haute déclare un contrat (classe abstraite servant de
  jeton) que la couche haute fournit : `SecretHost` et `ScrollStage`, fournis par `PortfolioPage`.
- Imports entre couches par les alias `@core/`, `@domain/`, `@shared/`, `@features/` ; relatifs à
  l'intérieur d'une fonctionnalité.
- Une feature : `data/` (stores, catalogues, logique pure), `ui/` (présentation), composants
  « intelligents » à la racine. Une section de page par dossier dans `features/page/`.

## Les règles qui gardent la loupe alignée

La copie rayons X est posée au pixel près sur la page, parfois dans une autre fenêtre (autre
taille, autre moment d'ouverture, pas de pointeur, pas de défilement propre). Donc :

1. Les rayons X ne changent que **couleurs, contours et opacités**, jamais la mise en page.
   Secrets (`appSecret`, classe `.x`) et dessins (`.xv`) sont en absolu dans des espaces réservés ;
   ce qui disparaît aux rayons X porte `surface-only`.
2. Tailles en `cqi` et `var(--vh)`, jamais `vw`/`vh` ; points de rupture en
   `@container page (…)`, jamais `@media (max-width: …)` dans la page.
3. Pas de `sticky`/`fixed` dans la page sans émulation pour les copies `.remote` (voir la nav).
4. Ce qui suit le défilement lit `ScrollStage` (`scrollY`, `vh`, `layout`, `stageTop`), jamais
   `window` ni un `IntersectionObserver`.
5. Les boucles CSS utilisent `animation-delay: var(--clock, 0ms)` avec une durée qui divise 120 s.
   Les animations d'arrivée sont réservées à la vraie page (`:host-context(.intro)`).
6. Les effets au pointeur ne tournent que sur la page principale et ne déplacent pas la mise en page.
7. **La loupe reste secrète** : elle n'existe que dans une autre fenêtre du navigateur, rétrécie
   par le visiteur lui-même. Aucun bouton ne l'ouvre ni ne montre la vue rayons X ; les seuls boutons
   flottants sont la version simple et le mode nuit. Ne réintroduis pas de loupe intégrée à la page.
8. Le seuil de la loupe (`LENS_WINDOW`, 680 × 620 px, dans `core/sync/window-size.ts`) fait partie
   du protocole entre fenêtres : toutes appliquent la même règle (`decideRole`).

## Contenu

Tout le texte est dans `src/app/domain/profile/profile.data.ts`. Seulement des faits vérifiés :
l'export LinkedIn, les dépôts publics github.com/BaptisteNodon, ou ce que dit Baptiste. N'invente
ni chiffre, ni technologie, ni promesse. Les détails d'infrastructure internes de ses notes
(serveurs, adresses IP, domaines) ne vont jamais sur le site. Les accroches et les titres de
section ont été rédigés par Claude : ce sont des propositions à faire valider.

## Style

Couleurs, polices et formes sont des variables CSS dans `src/styles/themes/` (`_clair.scss` par
défaut, aux couleurs de l'ancien portfolio : indigo et gris ; `_nuit.scss` pour le mode nuit). Aucune couleur en dur dans les composants : les transparences se dérivent avec
`color-mix()`. Les exports Google Stitch de `.claude/style/` sont des inspirations, pas des modèles à copier. Les
captures des projets sont dans `public/projects/` et s'affichent avec `NgOptimizedImage`.

## Skills du projet

| Skill | Quand |
| --- | --- |
| `ajouter-section` | ajouter, refondre ou déplacer une section de la page |
| `ajouter-secret` | ajouter ou déplacer un secret révélé par la loupe |
| `animer-sans-casser-la-loupe` | toute animation ou interaction, ou une loupe décalée |
| `changer-le-style` | couleurs, thèmes, polices, maquette à appliquer |
| `creer-une-feature` | nouveau service, store, dossier, état partagé entre fenêtres |
| `mettre-a-jour-le-contenu` | expériences, projets, compétences, formation, textes |
| `verifier-le-portfolio` | avant chaque commit : tests, build, navigateur, loupe simulée |
| `commit-feature` | à la fin de chaque feature, pour le message de commit |

## Conventions Angular et TypeScript

- Typage strict ; inférence quand le type est évident ; `unknown` plutôt que `any`.
- Composants autonomes, sans `standalone: true` (valeur par défaut depuis Angular 20).
- `ChangeDetectionStrategy.OnPush`, signaux, `computed()` pour l'état dérivé, `set`/`update`
  (jamais `mutate`).
- `input()`, `output()` et `inject()` plutôt que les décorateurs et l'injection par constructeur.
- Liaisons d'hôte dans l'objet `host` du décorateur, pas de `@HostBinding` ni de `@HostListener`.
- Contrôle de flux natif (`@if`, `@for`, `@switch`), liaisons `[class.x]` et `[style.x]` plutôt
  que `ngClass` et `ngStyle`, pipe `async` pour les observables.
- Gabarits simples ; gabarit en ligne pour un petit composant, chemins relatifs sinon.
- Services à responsabilité unique, `providedIn: 'root'` pour les singletons.
- Chargement paresseux : la route du shell, `@defer` pour la loupe et la singularité.
- Pas de global supposé disponible : la date du jour passe par le jeton `TODAY` ; seule l'horloge
  partagée (`core/time/clock.ts`) lit `Date.now()`, volontairement.
- Pas de zone.js : un changement visible passe par un signal ; le travail par image passe par
  `FrameLoop` et n'écrit un signal que si la valeur affichée change.
- `NgOptimizedImage` pour toute image statique (le site n'en utilise pas aujourd'hui).

## Accessibilité

Le site doit passer les contrôles AXE et respecter WCAG AA : contraste dans les deux modes, focus
visible, attributs ARIA, `prefers-reduced-motion` respecté. Les copies de loupe sont `inert` et
leurs secrets `aria-hidden` en surface.

## Environnement

- Windows, Git Bash et PowerShell. Node 25 fonctionne mais n'est pas une LTS (Node 24 conseillé) ;
  l'avertissement `--localstorage-file` pendant les tests est sans conséquence.
- Dans un spec, n'utilise pas le `localStorage` global (cassé sous Node 25).
- Dans le navigateur intégré, un onglet en arrière-plan suspend `requestAnimationFrame` : garde
  l'onglet testé au premier plan.
