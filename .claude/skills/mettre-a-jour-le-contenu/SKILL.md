---
name: mettre-a-jour-le-contenu
description: Mettre à jour le contenu du portfolio de Baptiste Nodon — expériences, nouveau poste, projets et réalisations, compétences, formation, certifications, coordonnées, accroches et titres de sections. À utiliser dès qu'il faut ajouter un projet, changer une date, corriger un texte, reprendre des infos depuis LinkedIn, un CV ou un dépôt GitHub, ou quand l'utilisateur raconte une nouvelle expérience.
---

# Mettre à jour le contenu

Tout le contenu est dans `src/app/domain/profile/profile.data.ts`, typé par `profile.model.ts`. Les
compteurs (mois en entreprise, jours d'alternance, distances, frise, graphe des compétences) sont
recalculés à partir de ces données par `src/app/domain/career/career.ts` et
`src/app/domain/skills/skills-graph.ts`.

## La règle d'or : seulement des faits vérifiés

- Les sources acceptées : l'export LinkedIn de Baptiste, ses dépôts publics
  (github.com/BaptisteNodon), et ce qu'il dit lui-même.
- N'invente ni chiffre, ni technologie, ni durée, ni promesse (« je réponds sous 24 h »). En cas de
  doute, demande-lui.
- L'ancien portfolio (`../PortefolioOld/angular-portfolio`) est aussi une source : projets,
  technologies, captures.
- Why So Serious (DI1-P1) n'est pas un projet de Baptiste : ne le remets pas.
- Ses notes de révision contiennent des détails d'infrastructure internes (noms de serveurs,
  adresses IP, domaines) : ils ne doivent jamais apparaître sur le site public.
- Les phrases d'accroche écrites par Claude sont des propositions : signale-les comme telles.

## Dates

Format `'AAAA'` ou `'AAAA-MM'` ; `end: null` pour un poste en cours. Une année seule est lue
comme une année scolaire (septembre → juin) dans la frise de formation.

## Expériences (`experiences`)

Champs : `id`, `company`, `shortName` (utilisé dans le graphe), `role`, `contract`, `start`,
`end`, `place` (ville, région, coordonnées GPS de la ville), `summary`, `skills` (identifiants de
`skills`), `secret` (coulisse ; `{jours}` est remplacé par le nombre de jours depuis le début),
`secretLabel`. Chaque expérience crée automatiquement le secret `exp-<id>`.

## Projets (`projects`)

Champs : `id`, `title`, `context`, `year`, `summary`, `highlights` (3 à 4 lignes courtes),
`skills`, `visual`, `featured?` (carte sur deux colonnes), `repo?` (lien public uniquement),
`secret`, `secretLabel`. Chaque projet crée automatiquement le secret `proj-<id>`.

`images` (facultatif) : captures rangées dans `public/projects/`, avec un `alt` qui décrit ce qu'on
voit ; elles défilent à la place de l'illustration. `year` est facultatif : ne mets une année que si
elle est sûre.

`visual` choisit l'illustration et le plan rayons X : `argus`, `crm`, `cine`, `drive`, `magasin`,
`visu3d`, `infra` ou `site`. Pour un
projet qui mérite sa propre illustration :
1. ajoute la valeur à `ProjectVisual` dans `profile.model.ts` ;
2. dans `src/app/features/page/projects/project-art/project-art.html`, ajoute un `@case` côté surface (petite
   interface animée en CSS) et un `@case` côté rayons X (un `svg.wire` en `viewBox="0 -40 400 260"`
   qui montre son plan de principe) ;
3. dans `project-art.scss`, donne-lui un fond avec `:host(.art-<visual>) .surface { … }`, des
   couleurs `--art-*` du thème, et des boucles calées sur `var(--clock)`.

## Compétences, formation, titres

- `skills` : `id`, `label`, `group` (`dev`, `archi`, `infra`, `pilotage`). Une compétence citée par
  une expérience ou un projet apparaît dans le graphe des co-occurrences ; sinon, déclare sa source
  dans `otherSkillSources`.
- `education` et `certifications` : la frise, le décodeur de sigles et le résumé « N ans de
  formation » se recalculent tout seuls.
- `headlines` : le grand titre et le chapeau de chaque section. `lead` et `kicker` : le haut de page.

## Vérifier

`npm test`. Certains tests figent des valeurs calculées à la date du 3 novembre 2026 (par exemple
`'12 + 2 + 2 = 16 mois'` et `J+337` dans `career.spec.ts` et `portfolio-page.spec.ts`) : quand les
données changent, mets ces attentes à jour en recalculant la nouvelle valeur, sans affaiblir le
test. Regarde ensuite les sections touchées, en surface et en rayons X (skill `verifier-le-portfolio`).
