---
name: commit-feature
description: Commiter la fin d'une fonctionnalité dans PortefolioV2 selon la règle de Baptiste — une note simple et humaine, puis une liste de détails. À utiliser à la fin de chaque intégration de feature (section, effet, thème, contenu, outil, correction), quand l'utilisateur dit « commite », « fais le git » ou « enregistre », et pour rédiger ou corriger un message de commit du projet.
---

# Commiter une feature

Baptiste a demandé un commit à **chaque fin d'intégration d'une feature**. C'est une autorisation
permanente pour ces commits-là. Elle ne couvre ni un travail à moitié fait, ni `git push`, ni la
fusion dans `main` : pour ceux-là, demande d'abord.

## Avant de commiter

1. La feature est **finie** : tout ce qui a été demandé est fait, `npm test -- --watch=false` et
   `npx ng build` passent. Pas de vérification dans le navigateur : Baptiste teste lui-même.
   Sinon, termine ou dis ce qui manque.
2. **Branche** : `git branch --show-current` doit afficher `dev`. On commite sur `dev`, sans
   branche de feature (choix de Baptiste). `main` est le site en ligne : un push sur `main` le
   publie sur GitHub Pages, donc on n'y fusionne `dev` que quand Baptiste le demande.
3. **Ce qui part dans le commit** : `git status --short`. N'ajoute que les fichiers de la feature
   (`git add <chemins>`), jamais `dist/`, ni un secret, ni un fichier que Baptiste modifie en
   parallèle sans rapport avec la feature : s'il y en a, laisse-les et signale-les.

## Le message

```
<Une note simple et humaine : ce qui change, dit comme on le raconterait à un ami>

- <détail concret>
- <détail concret>
- …

<la ligne d'attribution Co-Authored-By demandée par l'environnement>
```

- **La note** : en français, une seule phrase, environ 70 caractères au plus. Elle dit ce que
  ça change pour quelqu'un qui visite ou maintient le site, pas comment c'est codé. Pas de préfixe
  (`feat:`, `fix:`…), pas de jargon, pas de point final obligatoire.
- **La liste** : de 3 à 8 puces d'une ligne, concrètes, qui disent quoi et où : comportements,
  fichiers ou dossiers clés, chiffres utiles (taille, nombre de tests), et ce qui reste à faire
  s'il y en a.
- Pas d'autosatisfaction (« amélioration majeure », « code propre »), pas de redite de la note.

Écris le message avec un heredoc, pour garder les retours à la ligne et les accents :

```bash
git commit -q -F - <<'EOF'
La note

- détail
- détail

Co-Authored-By: …
EOF
```

Puis `git log --oneline -3` pour donner le hash à Baptiste, et termine par la liste du skill
`liste-a-tester`.

## Exemples

```
Le portfolio prend vie, et la loupe n'a plus besoin de bouton

- Une fenêtre rétrécie sous 680 × 620 px, pendant qu'une grande fenêtre du site est ouverte, devient la loupe toute seule et redevient le portfolio quand on l'agrandit
- Le code est rangé en couches et en features (core, domain, shared, features, shell), contrôlées avant chaque npm test
- Nouveau design animé : lettres du titre, sphère qui suit le pointeur, frise qui se remplit, compteurs, cartes inclinables
- Nouveaux projets tirés de GitHub (Argus, Ciné Baptiste)
- 40 tests, dont le rôle des fenêtres et l'horloge commune
```

```
On peut changer les couleurs du site depuis un seul fichier

- Toutes les couleurs, polices et formes sont des variables dans src/styles/themes/
- Les transparences suivent la couleur de base grâce à color-mix()
- Un thème « Nuit » d'exemple et un bouton de thème dans le dock
- ?theme=nuit dans l'URL pour tester sans enregistrer
```
