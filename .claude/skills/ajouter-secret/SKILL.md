---
name: ajouter-secret
description: Ajouter, déplacer ou retirer un secret du portfolio Révélateur — une coulisse cachée en surface et révélée par la loupe (note manuscrite, tampon, puce, schéma, code, compteur en direct). À utiliser dès qu'on parle de « face cachée », de chasse aux secrets, d'easter egg, de ce que montre la loupe ou de ce qui apparaît en rayons X, ou quand le compteur de secrets change.
---

# Ajouter un secret

Un secret est un élément invisible en surface, révélé dans la copie rayons X. La loupe le
« trouve » quand il reste un court instant sous son réticule ; il compte alors dans la
progression partagée entre fenêtres (et débloque la singularité quand tout est trouvé).

## 1. Le déclarer

Dans `src/app/features/secrets/data/secrets.catalog.ts`, ajoute une entrée à `SECRETS` :

```ts
{ id: '<section>-<nom>', label: 'Ce que la notification affiche une fois trouvé', section: '<SectionId>' },
```

- Un secret doit apprendre quelque chose de concret sur le profil (un chiffre, une compétence, un choix technique). Pas de clin d'œil gratuit du type « vous n'étiez pas censé voir ça ».
- L'identifiant est stable : les fenêtres ouvertes se l'échangent sur le bus et les gardent dans le navigateur (`pv2.secrets.found`) : renommer un identifiant fait perdre ce secret aux visiteurs qui l'avaient trouvé.
- Les secrets d'expériences et de projets sont générés à partir du profil (`exp-<id>`, `proj-<id>`,
  champs `secret` et `secretLabel` de `profile.data.ts`) : pour ceux-là, ne touche pas au catalogue.
- Le total, le compteur de la loupe et le seuil de la singularité suivent tout seuls.

## 2. Le poser dans le gabarit

```html
<p class="note" appSecret="<id>">texte révélé</p>
```

Importe `SecretDirective` (`@features/secrets/secret.directive`) dans le composant. La directive
ajoute la classe `x` (absolu, invisible en surface, `aria-hidden` en surface) et enregistre
l'élément pour la détection.

## 3. Le placer sans bouger la mise en page

- Le secret est positionné **en absolu**. Son parent doit être positionné : un élément avec
  `data-x` (déjà `position: relative`) ou un bloc réservé `.slot { position: relative; min-height: … }`.
- Place-le dans un **espace vide prévu en surface** (marge, colonne libre, bas de bloc). Ne
  réduis jamais l'espace des autres éléments pour lui faire de la place en rayons X : la copie
  doit rester identique à la surface.
- Taille raisonnable (moins d'environ 300 px de côté) pour tenir sous une petite loupe.

## 4. Choisir son habillage (styles globaux, `src/styles/base/_xray.scss`)

| Classe | Rendu | Usage |
| --- | --- | --- |
| `.note` | manuscrit jaune, rotation `--r` | remarque, calcul griffonné |
| `.chip` | étiquette mono cyan | mesure, valeur courte |
| `.code` | bloc `pre` magenta | formule, extrait de code |
| `.stamp` | tampon magenta, rotation `--r` | effet « confidentiel » |
| `.panel` + `.panel-title` | encadré pointillé | carte, décodeur, données en direct |
| `svg.wire` (`.d` pointillé, `.hot` magenta) | plan filaire | schéma d'architecture |

## 5. Le contenu

Uniquement des faits vérifiés ou des valeurs calculées (dans `domain/`), jamais d'invention.
Une valeur en direct (signal, horloge) est permise : les deux exemplaires l'affichent pareil.

## 6. Vérifier

`npm test` : `portfolio-page.spec.ts` vérifie que chaque secret du catalogue apparaît une fois,
et une seule, dans la page, et qu'il est masqué aux lecteurs d'écran en surface. Regarde ensuite
le résultat dans une loupe simulée (skill `verifier-le-portfolio`), puis commite (skill `commit-feature`).
