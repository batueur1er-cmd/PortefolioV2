---
name: creer-une-feature
description: Créer une nouvelle fonctionnalité dans le portfolio Révélateur (PortefolioV2) en respectant la clean architecture en couches — core, domain, shared, features, shell — et le contrôle automatique des dépendances. À utiliser pour tout nouveau service, store, composant d'interface, état partagé entre fenêtres ou nouveau dossier, pour déplacer du code entre couches, ou quand `npm run lint:archi` signale une dépendance interdite.
---

# Créer une feature

## Les couches

```
src/app/
├── core/      infrastructure sans métier : géométrie, DOM, horloge, thème, bus entre fenêtres
├── domain/    le profil et ses calculs, en TypeScript pur
├── shared/    briques d'interface et de mouvement réutilisables, sans métier
├── features/  une fonctionnalité par dossier : page, secrets, lens, singularity…
└── shell/     la racine de chaque fenêtre, qui assemble les fonctionnalités
```

| Couche | Peut importer |
| --- | --- |
| `core` | `core` |
| `domain` | `core`, `domain` |
| `shared` | `core`, `shared` |
| `features/x` | `core`, `domain`, `shared`, `x`, et les fonctionnalités listées pour `x` dans `FEATURE_DEPS` |
| `shell` | tout |

`scripts/check-architecture.mjs` vérifie ces règles. Il tourne avant chaque `npm test` et seul avec
`npm run lint:archi`. Aujourd'hui : `lens → page → secrets`, et `singularity` ne dépend de rien.

## Où mettre quoi

- **Un calcul sans Angular** (durée, tri, graphe, géométrie) : `domain/` s'il parle du métier,
  `core/` s'il est purement technique. Toujours avec un `.spec.ts`.
- **Une brique d'interface sans métier** (bouton, effet, liste) : `shared/ui` ou `shared/motion`.
- **Une fonctionnalité** : `features/<nom>/`, organisé ainsi :
  - `data/` : stores (`*.store.ts`, `providedIn: 'root'`), catalogues, logique pure, et leurs specs ;
  - `ui/` : composants de présentation, avec seulement des `input()` et `output()` ;
  - à la racine : les composants « intelligents » qui injectent les stores (ex. `lens-view.ts`).
- **L'assemblage** (quelle vue afficher, quelles fonctionnalités côte à côte) : `shell/`.

## Imports

- Entre couches, par les alias `@core/…`, `@domain/…`, `@shared/…`, `@features/…` (déclarés dans
  `tsconfig.json`).
- À l'intérieur d'une même fonctionnalité ou d'un même dossier de couche, en relatif.

## Inverser une dépendance plutôt que la casser

Quand une couche basse a besoin de quelque chose d'une couche haute, elle **déclare un contrat**
(classe abstraite servant de jeton) et c'est la couche haute qui le fournit. Exemples réels :
`SecretHost` (secrets) et `ScrollStage` (shared), tous deux fournis par `PortfolioPage` :

```ts
providers: [{ provide: SecretHost, useExisting: forwardRef(() => PortfolioPage) }],
```

Ajouter une dépendance entre fonctionnalités dans `FEATURE_DEPS` n'est permis que si elle ne crée
pas de cycle et qu'un contrat ne suffirait pas.

## État partagé entre fenêtres

- Un événement ponctuel (secret trouvé, thème changé) : ajoute une variante à `BusCommand` dans
  `core/sync/window-bus.ts`, envoie-la avec `bus.send(…)`, écoute `bus.commands$`.
- Un état continu (position, taille, défilement) : une `PresenceChannel` (`core/sync/presence-channel.ts`).
  Choisis bien la `key` : `roster` ne change que lorsqu'elle change.
- Ce qui doit survivre au rechargement : localStorage via `safeStorage()` (`core/dom/dom.ts`).

## Conventions Angular du projet

Composants autonomes (sans `standalone: true`), `ChangeDetectionStrategy.OnPush`, signaux et
`computed()`, `input()` et `output()`, liaisons dans l'objet `host` (pas de `@HostBinding`),
`inject()`, contrôle de flux natif (`@if`, `@for`, `@switch`), `@defer` pour une vue lourde ou
rare. L'application est **zoneless** : un changement visible doit passer par un signal. Le travail
par image passe par `FrameLoop` (voir le skill `animer-sans-casser-la-loupe`).

## Tests

Specs Vitest à côté des fichiers, intitulés en français. Dans un spec, n'utilise pas le
`localStorage` global (il est cassé sous Node 25) : teste la logique pure, ou injecte un stockage.

## Terminer

`npm test` (règles d'architecture comprises), `npx ng build`, vérification visuelle (skill
`verifier-le-portfolio`), puis un commit (skill `commit-feature`). Mets à jour le tableau des
couches du `README.md` et de `.claude/CLAUDE.md` si une fonctionnalité ou une règle a été ajoutée.
