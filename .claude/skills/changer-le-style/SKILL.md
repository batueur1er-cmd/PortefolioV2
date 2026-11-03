---
name: changer-le-style
description: Changer l'apparence du portfolio Révélateur — couleurs, palette des rayons X, polices, arrondis, ombres, ambiance générale — ou créer, renommer, supprimer un thème (papier, nuit…). À utiliser dès que l'utilisateur parle de couleur, de style, de design, de mode sombre, de police, de « look », d'une maquette Stitch ou d'un DESIGN.md à appliquer, même pour retoucher une seule teinte.
---

# Changer le style

Aucun composant ne contient de couleur en dur : tout passe par des variables CSS définies dans
`src/styles/themes/`. Changer une valeur à cet endroit change tout le site, rayons X et
illustrations compris.

## Les fichiers

| Fichier | Rôle |
| --- | --- |
| `src/styles/themes/_clair.scss` | thème par défaut (`:root`), aux couleurs de l'ancien portfolio ; définit **toutes** les variables |
| `src/styles/themes/_nuit.scss` | le mode nuit, qui ne surcharge que ce qui change |
| `src/styles/themes/index.scss` | liste des thèmes (`@use`) |
| `src/app/core/theme/themes.ts` | registre des thèmes (`clair`, `nuit`) |
| `src/app/features/page/portfolio-page.scss` | correspondance surface → rayons X (`:host(.xray)`) |
| `../PortefolioOld/` | l'ancien portfolio, source de la palette indigo et gris |

Les familles de variables : surface (`--paper`, `--paper-2`, `--ink`, `--muted`, `--accent`,
`--on-accent`, `--line`, `--ok`, `--glass`), rayons X (`--xbg`, `--xbg-2`, `--xl` cyan, `--xn`
jaune, `--xp` magenta, `--xtext`), illustrations (`--art-*`), singularité (`--void*`), polices
(`--serif`, `--sans`, `--mono`, `--hand`), formes (`--radius-*`, `--shadow-float`).

## Modifier une couleur

- Change la valeur dans le thème concerné, pas dans un composant.
- Les transparences se dérivent : `color-mix(in srgb, var(--ink) 14%, transparent)`. N'écris pas de
  `rgba(…)` figé, il ne suivrait pas le thème.
- En rayons X, la page remappe `--paper`, `--ink`, `--accent`… vers la palette `--x*` : un composant
  qui n'utilise que les variables de surface s'adapte tout seul.
- Vérifie le contraste AA (texte courant sur `--paper`, `--muted` compris) dans les deux modes.

## Ajouter un thème

1. Copie `_nuit.scss` sous `_<id>.scss` et change le sélecteur en `:root[data-theme='<id>']`.
2. Ne redéfinis que ce qui change : le reste vient de `_clair.scss`.
3. Ajoute `@use '<id>';` dans `index.scss` et `{ id: '<id>', label: '<Libellé>' }` dans `THEMES`.
4. Teste avec `http://localhost:4200/?theme=<id>` (impose le thème sans l'enregistrer), ou avec le
   bouton « Mode nuit », qui bascule entre `clair` et `nuit` (adapte `shell/control-dock.ts` pour un
   troisième thème). Le thème choisi est enregistré et partagé avec la fenêtre loupe.

## Changer de police

1. `npm install @fontsource-variable/<police>` (ou `@fontsource/<police>`).
2. Ajoute son CSS dans `angular.json` → `projects.portfolio-v2.architect.build.options.styles`,
   avant `src/styles/themes/index.scss`.
3. Modifie `--serif`, `--sans`, `--mono` ou `--hand` dans le thème.
4. **Relance `npm start`** : le serveur de dev ne relit pas `angular.json` à chaud.

## Appliquer une maquette (Stitch, Figma…)

Reprends la palette, les polices et l'esprit, mais garde les règles du site : surface éditoriale,
rayons X à mise en page identique, une seule couleur d'accent par vue. Une maquette qui change la
mise en page entre surface et rayons X ne peut pas être reprise telle quelle (voir les skills
`ajouter-section` et `animer-sans-casser-la-loupe`).

## Vérifier

Aucune couleur en dur ne doit rester dans les composants :

```bash
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/app --include=*.scss
```

Seuls les blancs et noirs purs des reflets (`#fff`, `#000` dans un `color-mix`) et les masques
(`mask`, `mask-image`, où seule l'opacité compte) sont tolérés. Regarde
ensuite la surface, le mode nuit et une loupe simulée (skill `verifier-le-portfolio`).
