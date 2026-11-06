---
name: liste-a-tester
description: À la fin de chaque feature ou demande de Baptiste sur le portfolio, lui donner la liste de ce qui a été mis en place et de quoi tester à la main, au lieu de le vérifier soi-même dans le navigateur. À utiliser à chaque fin de tâche qui change le site (nouvelle fonction, correction, réglage, texte), juste après le commit.
---

# La liste à tester

Baptiste teste lui-même. Ne passe pas de temps à vérifier dans le navigateur : pas de navigateur
intégré, pas de captures Playwright, pas de loupe simulée, et pas de nouveaux tests de bout en bout,
sauf s'il le demande.

Avant un commit, il reste seulement les vérifications rapides : `npm test -- --watch=false`
(règles d'architecture comprises) et `npx ng build`. Si elles échouent, corrige avant de commiter.

## À la fin

Après le commit (skill `commit-feature`), termine ta réponse par la liste, en français :

```markdown
### À tester

**<Nom de la feature>** (commit <hash>)
- [ ] Où aller : <page ou section, ex. /projets/doom/demo>
- [ ] Quoi faire : <geste précis> → attendu : <ce qu'on doit voir>
- [ ] Aux rayons X (loupe) : <ce qui doit changer>, s'il y a lieu
- [ ] Mode nuit, écran de téléphone : seulement si la feature touche à l'affichage
```

- Une entrée par feature ou correction de la demande, dans l'ordre où elles ont été faites.
- Chaque case est un geste suivi de l'attendu : on la coche sans réfléchir.
- Mentionne les cas limites qui valent le coup (valeurs extrêmes d'un curseur, fenêtre étroite,
  rechargement, deux fenêtres côte à côte pour la loupe).
- Dis aussi ce qui n'a pas été vérifié du tout (ex. « je n'ai rien ouvert dans le navigateur »).
- Rien d'autre : pas de captures, pas de résumé des tests lancés.

## Exemple

```markdown
### À tester

**Champ de vision de la démo Doom** (commit a80a40d)
- [ ] /projets/doom/demo, curseur « Champ de vision » sous le pavé → 90° au départ
- [ ] Glisser à 60° → l'image zoome, le cône de la carte se resserre
- [ ] Glisser à 120° → on voit presque tout le hall, aucun trou dans l'image
- [ ] Lancer le ralenti puis bouger le curseur → retour au direct
- [ ] Loupe sur la démo → même champ de vision ; la note affiche la focale en pixels
```
