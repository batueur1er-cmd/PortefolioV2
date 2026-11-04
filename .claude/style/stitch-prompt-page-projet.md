# Prompt Google Stitch : la page d'un projet

À coller **dans le même projet Stitch** que les autres écrans, pour garder le même style. Le
prompt est en anglais, car Stitch le suit plus fidèlement, mais tout le texte affiché reste en
français.

Le contenu de l'exemple est celui du projet « Drive en Laravel » (`/projets/drive`). C'est le seul
qui a 5 captures, donc il montre bien la galerie. Une fois la maquette prête, renvoie-moi la capture PNG
et, si possible, le HTML exporté. Nomme-les `17-page-projet.png` et `17-page-projet-mobile.png`.

Cette page n'a pas de version rayons X, car la loupe ne fonctionne que sur l'accueil. La mise en page
y est donc libre.

---

## 17 · Page d'un projet (étude de cas)

```text
Design a "project case study" page for the same portfolio (same design system, palette, fonts
and tone as the other screens of this project: light theme, near-white paper background
#f9fafb, ink #111827, muted grey #4b5563, indigo accent #4f46e5 with a violet second tint
#9333ea for gradients; large condensed serif display headings, a clean grotesk for body text,
and a monospace for small uppercase labels with wide letter-spacing).

Desktop web, 1440 px wide. All visible text in French. This page is reached by clicking a
project card on the home page; it must feel like a calm, editorial continuation of the home
page, not a different website.

Structure, top to bottom:

1. Sticky top bar, thin bottom border, translucent paper background with blur.
   Left: a circular "BN" monogram + "Baptiste Nodon" in the serif.
   Right: a pill link "← Toutes les réalisations" in monospace caps.

2. Project header, generous whitespace, left aligned on a 1200 px content column.
   - Kicker line in monospace caps: "04 ——— PROJET BTS SIO" (index in indigo, a short rule).
   - Huge serif title: "Drive en Laravel".
   - One-paragraph summary in large muted body text, max ~720 px wide:
     "Un site de courses en ligne façon « drive », réalisé en PHP avec des vues générées côté
     serveur par Laravel et Blade."
   - A row of quick facts as small labelled chips: "Contexte : Projet BTS SIO",
     "Rôle : développement", "Stack : PHP · Laravel · JavaScript · SQL · MySQL".

3. Hero visual: the main screenshot of the app, full content width, 16:9, rounded 16 px corners,
   1 px subtle border, soft long shadow, sitting slightly over a pale indigo (#eef2ff) band that
   bleeds to the page edges. Use a plausible e-commerce grocery web app screenshot placeholder.

4. Two-column section separated by a thin rule:
   - Left (wide): label "CE QUE J'AI FAIT" in indigo monospace caps, then a numbered list of
     4 short lines, each on its own row with a hairline separator and a small "01", "02"… in
     indigo monospace. Example lines: "Catalogue de produits avec catégories",
     "Panier et commande", "Comptes clients", "Base MySQL et vues Blade".
   - Right (narrow, sticky while scrolling): a card with label "STACK" and technology tags as
     small rounded pills on the pale indigo background; below it an outlined pill button
     "Voir le dépôt GitHub ↗".

5. Screenshot gallery, label "CAPTURES". An editorial masonry or alternating layout of the 4
   remaining screenshots (some full width, some two by two), each in a rounded frame with a
   short caption underneath in small muted text (e.g. "Page d'accueil du drive",
   "Fiche produit", "Panier", "Espace client"). Leave room for screenshots of different
   proportions (web pages and desktop app windows).

6. Optional "Ce que j'en retiens" block: a single large serif quote-style sentence on the pale
   indigo band, left aligned, with a thin indigo rule above it. Placeholder text:
   "Mon premier site complet côté serveur : routes, modèles, vues et base de données."

7. Previous / next navigation: two large bordered cards side by side, left
   "← PRÉCÉDENT · Gestion de magasin", right "SUIVANT → · Visualiseur 3D", the project titles
   in the serif. Hover state: indigo border and a 2 px lift.

8. Small footer consistent with the home page.

Floating at the bottom right, keep the same small dark pill button "MODE NUIT" as on the home
page (it is the only floating control).

Mood: editorial, airy, precise, a bit like a design magazine case study. Subtle motion hints
only (no heavy decorations). Accessible contrast (WCAG AA).
```

### Variante mobile (à générer en éditant l'écran ci-dessus)

```text
Same project page in mobile layout, 390 px wide. Top bar keeps only the "BN" monogram and the
"← Réalisations" pill. Title scales down but stays the dominant element. The two-column section
stacks: "CE QUE J'AI FAIT" first, then the stack card. Gallery becomes a single column.
Previous / next cards stack vertically. Keep the "MODE NUIT" floating pill at the bottom right.
```

### Variante mode nuit (facultative)

```text
Same desktop project page in the dark theme of this project: background #1f2937, secondary
surfaces #374151, text #f9fafb, accent #818cf8 and second tint #c084fc. Keep every position and
size identical; only colours change.
```

---

**À savoir :** les lignes « Ce que j'ai fait », les légendes des captures et le bloc « Ce que
j'en retiens » sont des exemples pour la maquette. Sur le vrai site, je n'afficherai que ce que tu
m'auras confirmé pour chaque projet.
