---
name: verifier-le-portfolio
description: Vérifier que le portfolio Révélateur fonctionne après une modification — règles d'architecture, tests Vitest, build de production et budgets, rendu en surface et en rayons X, loupe de poche, et loupe multi-fenêtres simulée dans le navigateur intégré. À utiliser avant tout commit, avant de dire « c'est fait », après un changement de style, de contenu ou d'animation, et dès que l'utilisateur demande de tester, vérifier ou montrer le site.
---

# Vérifier le portfolio

Avance dans l'ordre : chaque étape est plus lente que la précédente, inutile d'ouvrir le navigateur
si les tests échouent. Dis honnêtement ce qui n'a pas pu être vérifié.

## 1. Tests et architecture

```bash
npm test -- --watch=false
```

La commande lance d'abord `scripts/check-architecture.mjs` (sens des dépendances entre couches),
puis Vitest. L'avertissement de Node 25 sur `--localstorage-file` est sans conséquence.

## 2. Build de production

```bash
npx ng build
```

Surveille les avertissements de budget (`angular.json` : 600 kB au chargement initial, 10 kB par
feuille de style de composant). Référence actuelle : environ 254 kB, 71 kB transférés.

## 3. Le site dans le navigateur intégré

- Démarre ou réutilise le serveur avec `preview_start` (configuration « portfolio » de
  `.claude/launch.json`). **Après une modification d'`angular.json` ou de `tsconfig.json`, arrête et
  relance le serveur** : il ne relit pas ces fichiers à chaud.
- Pour aller à une section sans le défilement doux :
  `document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.querySelector('[data-section=parcours]').offsetTop)`.
- Les lettres du titre mettent environ 2 s à arriver après un chargement : attends avant de juger
  le hero. Un enregistrement de fichier recharge la page (retour en haut).
- Garde l'onglet testé **au premier plan** et le panneau du navigateur **affiché** : sinon
  `requestAnimationFrame` est suspendu ; la loupe change bien de rôle, mais son image ne se cale pas.

Passe en revue :
1. **Surface** : chaque section, de l'accueil au pied de page.
2. **Mode nuit** : le seul bouton flottant ; vérifie le contraste des deux thèmes.
3. **Rayons X** : aucun bouton ne les montre, volontairement ; passe par la loupe simulée de
   l'étape 4 (change `SCROLL_Y` dans le script pour viser une autre section).
4. **Console** : `read_console_messages` avec `onlyErrors`.

## 4. Loupe simulée

Le navigateur intégré n'ouvre que des onglets, mais chaque onglet peut prendre une taille de
fenêtre et le bus `BroadcastChannel` les relie :

1. Ouvre un onglet **au premier plan** (`tabs_create` avec `foreground: true`) sur
   `http://localhost:4200/`, puis `resize_window` à 480 × 380.
2. Lis `scripts/simuler-grande-fenetre.js` et passe son contenu tel quel à `javascript_tool`.
   Attendu : `role: 'loupe'`, titre « Loupe — Baptiste Nodon », `transformation` égale à `attendu`,
   une section affichée, et deux colonnes dans `colonnesProfil`.
3. Fais une capture : HUD, réticule et page en rayons X.
4. Lance `scripts/arreter-simulation.js` : l'onglet doit redevenir `portfolio`.
5. Remets l'onglet en `preset: 'desktop'` et ferme-le.

`?loupe` dans l'URL impose le rôle de loupe, et `?portfolio` celui de portfolio, sans attendre la
détection.

## 5. Ce qui reste à faire à la main

Le vrai alignement entre deux fenêtres côte à côte ne se vérifie qu'avec deux vraies fenêtres du
navigateur, au même zoom. Signale-le dans le compte rendu s'il n'a pas été testé.
