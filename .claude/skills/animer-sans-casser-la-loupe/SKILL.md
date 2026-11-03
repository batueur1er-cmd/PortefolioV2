---
name: animer-sans-casser-la-loupe
description: Ajouter ou modifier une animation, une transition, un effet au survol, un effet au défilement ou une interaction dans le portfolio Révélateur sans désaligner la loupe — et diagnostiquer une loupe décalée, en retard ou qui ne montre pas la même chose que la page. À utiliser pour tout ce qui « bouge », rend le site « plus vivant », réagit au pointeur ou au scroll, même pour un petit effet CSS.
---

# Animer sans casser la loupe

La loupe affiche une **copie** de la page, souvent dans une autre fenêtre : ouverte à un autre
moment, avec une autre taille de fenêtre, sans pointeur, et qui ne défile pas elle-même. Les seules
choses que les deux exemplaires partagent sont : le **défilement** du portfolio, sa **hauteur**,
sa **largeur de mise en page** et **l'horloge** de la machine. Une animation reste alignée si elle
ne dépend que de ça.

## La boîte à outils (`src/app/shared/motion/`, `src/app/shared/ui/`)

| Outil | Pour |
| --- | --- |
| `appReveal` (`[appReveal]="120"` pour un retard en ms) | apparition au défilement |
| `watchReveal(element)` | même règle dans un composant sur mesure |
| `<app-count-up [value]="16" />` | nombre qui défile, largeur réservée |
| `<app-scroll-words [text]="…" />` | mots qui s'allument au fil du défilement |
| `<app-split-text [text]="…" by="letter|word" />` | lettres ou mots avec leur rang `--i` |
| `<app-marquee [items]="…" [duration]="60" />` | bandeau sans fin, calé sur l'horloge |
| `appTilt`, `appMagnetic` | effets au pointeur (page principale seulement) |
| `ScrollStage` + `stageTop()` | toute valeur liée au défilement |

## Les règles, et pourquoi

1. **N'anime que `transform`, `opacity`, `filter` et les couleurs.** Animer une largeur, une marge
   ou une position dans le flux change la mise en page d'un seul exemplaire.
2. **Ce qui dépend du défilement lit la scène, pas `window`.** Injecte `ScrollStage` et calcule
   avec `scrollY()`, `vh()` et `stageTop(stage, element)`, en lisant `layout()` dans le `computed`
   pour remesurer quand la page bouge. Pas de `window.scrollY`, pas d'`IntersectionObserver` : la
   copie d'une loupe ne défile pas, elle reçoit le défilement du portfolio.
   ```ts
   private readonly stage = inject(ScrollStage);
   protected readonly progress = computed(() => {
     this.stage.layout();
     const top = stageTop(this.stage, this.host);
     return clamp((this.stage.scrollY() + this.stage.vh() * 0.5 - top) / this.host.offsetHeight, 0, 1);
   });
   ```
3. **Les boucles CSS sont calées sur l'horloge.** Écris `animation-delay: var(--clock, 0ms)` et une
   durée qui divise 120 s (`LOOP_PERIOD` dans `core/time/clock.ts`) : 2, 3, 4, 5, 6, 8, 10, 12,
   15, 20, 24, 30, 40 ou 60 s. Pour échelonner : `calc(var(--clock, 0ms) - var(--d) * 0.4s)`. Ainsi
   deux fenêtres ouvertes à des moments différents montrent le même instant du cycle.
4. **Les animations d'arrivée sont réservées à la vraie page** : préfixe-les par
   `:host-context(.intro)` (les copies n'ont pas cette classe) et utilise `backwards` plutôt que
   `both`, pour que les états de survol reprennent la main ensuite.
5. **Les effets au pointeur ne déplacent que des éléments décoratifs** et ne tournent pas sur les
   copies (`page.decorative()`).
6. **Le JavaScript par image passe par `FrameLoop.add`**, écrit directement dans le DOM, et ne
   modifie un signal que si la valeur affichée change : pas de détection de changements à 60 Hz.
   Les événements fréquents (`scroll`, `pointermove`) sont regroupés par `requestAnimationFrame`.
7. **Un état qui avance tout seul en JS** (texte tapé, minuterie visible) se calcule depuis
   `Date.now()`, jamais depuis l'instant de montage du composant.
8. **Points de rupture** : `@container page (…)`, jamais `@media (max-width: …)` dans la page.
9. **`prefers-reduced-motion`** : la règle globale raccourcit tout ; vérifie que l'état final reste
   lisible (texte complet, compteur à sa valeur, élément visible).

## La loupe est décalée ? Cherche dans cet ordre

1. Une `@media (max-width…)`, ou des unités `vw`/`vh`, dans un composant de la page :
   `grep -rn "@media (max-width\|[0-9]vw\|[0-9]vh" src/app/features/page src/app/shared`.
2. Un élément `sticky` ou `fixed` dans la page sans émulation `.remote`.
3. Une animation de propriété de mise en page, ou une animation d'arrivée sans `.intro`.
4. Une boucle sans `var(--clock)`, ou dont la durée ne divise pas 120 s.
5. Une valeur liée au défilement qui lit `window` au lieu de `ScrollStage`.
6. Un contenu qui dépend de l'état local d'une fenêtre (survol, filtre, onglet ouvert) et change la
   hauteur d'un bloc : garde ces états purement visuels, ou partage-les sur le bus.
7. Hors code : un zoom navigateur différent dans les deux fenêtres, ou une loupe ouverte en onglet.

Termine par le skill `verifier-le-portfolio`, qui sait simuler une loupe dans le navigateur intégré.
