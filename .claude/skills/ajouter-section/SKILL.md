---
name: ajouter-section
description: Ajouter, refondre, déplacer ou supprimer une section de la page du portfolio Révélateur (PortefolioV2, Angular 21) — hero, profil, parcours, réalisations, compétences, formation, coulisses, contact, ou une nouvelle partie (témoignages, loisirs, publications…). À utiliser dès qu'on touche à la structure de la page ou qu'on veut « un nouveau bloc », même si le mot « section » n'est pas prononcé.
---

# Ajouter une section au portfolio

La page existe en **deux exemplaires** : la surface, dans la fenêtre portfolio, et une copie
« rayons X » affichée dans une loupe (une autre fenêtre du navigateur, rétrécie). La copie
est posée au pixel près sur l'original. Une section n'a donc le droit de différer entre les deux
que par ses **couleurs, contours et opacités** : toutes les règles ci-dessous en découlent.

## 1. Ranger les fichiers

- Un dossier par section : `src/app/features/page/<nom>/<nom>-section.ts|html|scss`.
- Les sous-composants vont dans le même dossier (ex. `experience/career-map.ts`).
- Tout calcul pur (durées, cumuls, mise en forme de données) va dans `src/app/domain/…` avec un
  `.spec.ts`, comme `domain/career/career.ts`. Le composant ne fait qu'afficher.
- Le texte vient de `src/app/domain/profile/profile.data.ts`, jamais du gabarit (sauf les
  micro-libellés d'interface).

## 2. Squelette

```ts
@Component({
  selector: 'app-<nom>-section',
  imports: [SectionHeader, RevealDirective, SecretDirective],
  templateUrl: './<nom>-section.html',
  styleUrl: './<nom>-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Nom>Section {
  protected readonly page = inject(PageContext);
  protected readonly headline = PROFILE.headlines.<cle>;
}
```

```html
<section
  class="wrap sec"
  data-section="<id>"
  data-label="<Nom affiché>"
  [attr.id]="page.anchor('<id>')"
  [attr.aria-labelledby]="page.anchor('<id>-titre')"
>
  <app-section-header
    index="08"
    name="<Nom affiché>"
    [title]="headline.title"
    [intro]="headline.intro ?? null"
    [titleId]="page.anchor('<id>-titre')"
  />
  <!-- contenu, avec appReveal sur les blocs qui apparaissent au défilement -->
</section>
```

Pourquoi ces attributs :
- `data-section` / `data-label` : la loupe affiche « § Nom » sous son réticule et la navigation
  calcule la section active à partir d'eux.
- `page.anchor(…)` au lieu d'un `id` en dur : les copies de loupe ne posent aucune ancre, sinon les
  identifiants seraient dupliqués dans le document.
- `wrap` et `sec` sont les primitives globales (`src/styles/base/_layout.scss`).

## 3. Brancher la section

1. Ajoute la clé à `SectionKey` et à `headlines` (`domain/profile/profile.model.ts` et `profile.data.ts`).
2. Importe le composant dans `features/page/portfolio-page.ts` (tableau `imports` et gabarit, à sa place).
3. Si elle doit figurer dans la navigation, ajoute-la à `links` dans `features/page/nav/site-nav.ts`.
4. Si elle contient des secrets, ajoute son identifiant à `SectionId`, `SECTION_ORDER` et
   `SECTION_LABELS` dans `features/secrets/data/secrets.catalog.ts` (voir le skill `ajouter-secret`).
5. Mets à jour la liste des sections attendue dans `features/page/portfolio-page.spec.ts`.

## 4. Mise en page compatible avec la loupe

- **Tailles** : `cqi` (largeur de la page) et `var(--vh)` (hauteur de la fenêtre portfolio).
  Jamais `vw` ni `vh` : la loupe n'a pas la taille du portfolio.
- **Points de rupture** : `@container page (max-width: …)`, jamais `@media (max-width: …)`. Une
  loupe de 480 px affiche une page de 1440 px : avec une media query, elle passerait en mise en
  page mobile et ne serait plus alignée.
- **Pas de `position: sticky` ou `fixed`** dans la page sans émulation : la copie d'une autre
  fenêtre ne défile pas. La navigation montre comment faire (`:host-context(.remote)` et `--sy`).
- **Réserve la place des secrets** : un bloc `position: relative` avec une `min-height` (ex. `.slot`),
  où les secrets se placent en absolu. En surface, cet espace doit se lire comme un blanc voulu.
- Ce qui doit disparaître aux rayons X : classe `surface-only` (il garde sa place). Un dessin
  rayons X qui n'est pas un secret à trouver : classe `xv`.
- Accessibilité : contraste AA dans les deux modes, focus visible, `aria-labelledby` sur la section.

## 5. Animer

Suis le skill `animer-sans-casser-la-loupe` : `appReveal` pour les apparitions, `CountUp`,
`ScrollWords`, boucles calées sur `var(--clock)`.

## 6. Terminer

Vérifie avec le skill `verifier-le-portfolio` (tests, build, surface, rayons X, loupe), puis
commite selon le skill `commit-feature`.
