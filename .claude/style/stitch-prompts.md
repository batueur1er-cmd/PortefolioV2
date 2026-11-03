# Prompts Google Stitch — refonte visuelle du portfolio « Révélateur »

Ce fichier contient un prompt à coller dans Google Stitch pour chaque vue de l'app. Les maquettes
obtenues serviront de référence pour réécrire les styles Angular.

## Mode d'emploi

1. **Crée un seul projet Stitch** et colle d'abord le **prompt 0 (système de design)**. Tous les
   écrans suivants doivent rester dans le même projet, sinon le style dérive d'un écran à l'autre.
2. Colle ensuite les prompts dans l'ordre. Ils sont en anglais parce que Stitch les suit plus
   fidèlement, mais tout le texte affiché reste en français.
3. Pour chaque écran, **génère d'abord la version « surface »**, puis la version **« rayons X »**
   en *éditant* cet écran (bouton « Edit » / variante), pas en repartant de zéro. C'est la
   contrainte la plus importante de l'app (voir plus bas).
4. Mode **Web** (desktop, 1440 px) par défaut. Les prompts 15 et 16 demandent les versions mobiles.
5. **Renvoie-moi** pour chaque écran : la capture PNG et, si possible, le code HTML exporté.
   Nomme-les avec le numéro du prompt, par exemple `03-hero-surface.png` et `03-hero-xray.png`.

### Pourquoi « rayons X » doit garder la même mise en page

La loupe affiche une seconde copie de la page, superposée au pixel près à la première. Le mode
rayons X a donc le droit de changer **uniquement** les couleurs, les contours, les opacités et les
fonds. Il n'a pas le droit de changer les tailles de police, les marges, les positions ou l'ordre
des blocs. Les éléments cachés (notes, schémas, tampons, chiffres) apparaissent dans des **espaces
vides prévus dès la version surface**. Si une maquette rayons X déplace quelque chose, je
l'adapterai, mais plus elle est fidèle, mieux c'est.

### Ce qui est libre

Tout le reste : la palette, les typos, l'ambiance, les formes, les illustrations et les icônes.
Le prompt 0 propose une direction. Remplace le bloc « Art direction » si tu as une autre idée
(trois variantes sont proposées à la fin du fichier).

---

## 0 · Système de design (à coller en premier)

```text
I'm designing a personal developer portfolio website in French for "Baptiste Nodon", an
apprentice software developer (Bachelor "Coordinateur de projets informatiques" at DIIAGE,
apprenticeship at Quercy Réfrigération). The site has a hidden side: a "lens" (a second small
browser window or a circle following the mouse) reveals an "X-ray" version of the same page with
hidden notes, blueprints, live calculations and 24 collectible secrets.

Every screen will exist in two variants that MUST share the exact same layout:
- SURFACE: the normal, polished portfolio.
- X-RAY: same grid, same text positions, same font sizes, same spacing. Only colors, outlines,
  opacity and backgrounds change. Text becomes outlined or glowing on a dark technical
  background, and hidden elements appear in empty spaces that already exist in the surface layout.

Art direction (editable):
- Surface: editorial, warm and confident. Off-white paper background, near-black ink, one strong
  accent color. Large serif display headings mixed with a clean grotesque for body text and a
  monospace for small labels and numbers. Generous whitespace, asymmetric editorial grid, thin
  rules, numbered sections ("01 —", "02 —").
- X-ray: deep navy/black background with a subtle blueprint grid, cyan for outlines and
  wireframes, yellow for handwritten-style notes, magenta for highlights and stamps. Text turns
  into outlines or dim strokes, images become wireframes.

Create a design system with: color tokens for both variants, a type scale (display, h2, body,
label, mono), buttons (primary, ghost, pill/chip), a tag/chip, a section header with an index
number, a card, a "secret note" sticker (handwritten, yellow), a "stamp" (rotated, magenta
border), a "chip" (small mono label on dark background) and a "panel" (dark box with cyan
border). Show every component in both SURFACE and X-RAY variants side by side.
```

---

## 1 · Navigation

```text
Design the top navigation bar of the portfolio (desktop, 1440px), SURFACE variant.
- Left: the name "Baptiste Nodon" as a small wordmark.
- Center or right: anchor links "Profil", "Parcours", "Réalisations", "Compétences",
  "Formation", "Contact".
- Right: a small link "LinkedIn ↗".
- Leave a small empty area just below the wordmark: in X-ray mode a tiny mono chip appears
  there with the text "v2.0 · Angular 21 · zoneless".
Sticky, light, thin bottom rule. Then make the X-RAY variant: same layout, links in cyan
outline style, the version chip visible below the wordmark.
```

## 2 · Accueil (hero) — surface

```text
Design the hero section of the portfolio (first screen, 1440x900), SURFACE variant.
Content:
- Kicker (small mono label): "Apprenti développeur · Bachelor CPI · DIIAGE"
- Huge display title on two lines: "Baptiste" / "Nodon"
- Lead paragraph: "Du serveur à l'interface : je développe des outils métiers qui tiennent la
  route, sans jamais perdre de vue l'infrastructure qui les fait tourner."
- Status line with a small green dot: "En alternance chez Quercy Réfrigération"
- Location: "Auvergne-Rhône-Alpes, France"
- Two buttons: "Voir le parcours" (primary) and "Me contacter" (ghost)
- A decorative abstract shape or orb on the right side (it hides in X-ray mode)
Leave clear empty space: to the right of the title (for a measurement annotation), in the top
right corner (for a rotated stamp) and near the bottom (for a handwritten note). Keep the bottom
120px free: a floating control dock overlays it.
```

## 3 · Accueil (hero) — rayons X

```text
Edit the hero screen into its X-RAY variant. Keep every element at the exact same position and
size. Change only colors, outlines and opacity:
- Dark blueprint background with a faint grid.
- "Baptiste" in cyan outline, "Nodon" as transparent text with a magenta stroke.
- The decorative orb disappears, replaced by its thin cyan wireframe (circles, crosshair,
  construction lines).
- New hidden elements in the reserved empty spaces:
  - next to the title, a dimension line with the mono label "font-size : 168 px · mesuré en direct";
  - top right, a rotated magenta stamp "VOUS N'ÊTES PAS CENSÉ VOIR ÇA";
  - near the bottom, a yellow handwritten note "cette page existe en deux exemplaires : une pour
    vous, une pour la loupe".
- Each hidden element has a tiny mono tag like "#hero-stamp" attached to it.
```

## 4 · Profil (à propos)

```text
Design the "Profil" section, SURFACE variant. Section header "01 — Profil".
- Title: "Un parcours qui part de l'infrastructure pour arriver au code."
- Two paragraphs:
  "Après un bac Mathématiques et informatique, puis un BTS Services informatiques aux
  organisations au lycée Lamartine, j'ai rejoint le DIIAGE pour un Bachelor Coordinateur de
  projets informatiques."
  "Depuis décembre 2025, je suis apprenti en développement informatique chez Quercy
  Réfrigération, à Villefontaine. Avant ça, j'ai configuré des serveurs et un réseau Windows et
  Linux pour une communauté de communes, puis développé un CRM interne en Angular pendant un
  stage de six semaines."
- A column of 3 key facts with big numbers: "3 expériences", "11 mois sur le terrain",
  "3 diplômes".
Leave empty space beside the paragraphs and under the facts.
Then the X-RAY variant, same layout: a dark panel appears in the empty space with the label
"résumé LinkedIn d'origine" and the text "Actuellement en Bachelor CPI (Coordinateur de projets
informatiques). Je recherche actuellement une alternance pour une durée d'un an." followed by a
yellow note "alternance trouvée en décembre 2025 ✔". Under the facts, a yellow handwritten
calculation: "2 + 2 + 11 = 15 mois… à date".
```

## 5 · Parcours (expériences)

```text
Design the "Parcours" section, SURFACE variant. Section header "02 — Parcours".
Left (wide): a vertical timeline with 3 entries, each with dates, role, company, city,
contract type and a one-line summary:
1. "déc. 2025 — aujourd'hui" · "Apprenti en développement informatique" · "Quercy Réfrigération"
   · Villefontaine · Alternance · "Développement informatique en alternance, en parallèle du
   Bachelor Coordinateur de projets informatiques."
2. "mars 2025 — avr. 2025" · "Stagiaire en informatique" · "Celere Ouvertures" ·
   Saint-Georges-de-Reneins · Stage · 6 semaines · "Création d'un CRM interne en Angular pour
   gérer les clients et générer des rapports." · tags Angular, TypeScript, HTML & CSS
3. "mai 2024 — juin 2024" · "Stagiaire au service informatique" · "Communauté de Communes
   Saône-Beaujolais" · Belleville-en-Beaujolais · Stage · "Configuration de serveurs et gestion
   du réseau sous Windows et Linux." · tags Infrastructure, Serveurs, Réseau, Windows, Linux
Right (narrow, sticky aside): a calm empty area with only a caption "Le fil du parcours".
Then the X-RAY variant, same layout: each entry shows a thin horizontal duration bar under its
dates and a yellow note ("J+337 d'alternance · compteur en direct", "6 semaines · 1 CRM ·
clients + rapports", "Windows ⇄ Linux : les deux camps"). The right aside becomes a dark panel
with a minimalist line map: 3 dots (Belleville, Saint-Georges, Villefontaine), Lyon as a
landmark, dashed legs labelled in km and a total "≈ 66 km parcourus".
```

## 6 · Réalisations (projets)

```text
Design the "Réalisations" section, SURFACE variant. Section header "03 — Réalisations".
Three project cards, each with a visual area on top (abstract CSS-art style illustration, no
photo), then title, context, year, summary and skill tags:
1. "CRM interne" · Celere Ouvertures · 2025 · "Application Angular pour gérer les clients de
   l'entreprise et générer des rapports, conçue et développée pendant un stage de six semaines."
   Visual: abstract dashboard with a table and a bar chart.
2. "Serveurs & réseau" · CC Saône-Beaujolais · 2024 · "Configuration de serveurs et gestion du
   réseau d'une collectivité, dans un environnement mixte Windows et Linux." Visual: abstract
   server racks and network nodes.
3. "Portfolio v2" · Projet personnel · 2026 · "Ce site : un portfolio Angular qui se lit à deux
   fenêtres, avec synchronisation multi-fenêtres, rendu « rayons X » et chasse aux secrets."
   Visual: two overlapping browser windows.
Then the X-RAY variant, same layout: every visual becomes a cyan wireframe blueprint of the same
thing, with a mono chip on top ("schéma de principe · clients ↔ rapports", "schéma de principe ·
Windows ⇄ Linux", "2 fenêtres · 1 page · 0 serveur").
```

## 7 · Compétences

```text
Design the "Compétences" section, SURFACE variant. Section header "04 — Compétences".
Three columns, each a group with a title, caption and a vertical stack of skill tags:
- "Développement" — "Applications web et outils métiers": Angular, TypeScript, .NET Framework,
  HTML & CSS
- "Infrastructure" — "Serveurs, réseau, systèmes": Infrastructure informatique, Serveurs,
  Réseau, Windows, Linux
- "Pilotage" — "Projets et certification": Coordination de projets, Certification PIX
Leave about 26px of vertical gap between tags (a small annotation goes under each in X-ray) and
an empty row below the columns.
Then the X-RAY variant, same layout: thin curved cyan lines connect skills that are used
together in the same experience (a co-occurrence graph drawn behind the tags), each tag gets a
tiny mono annotation below it such as "↳ Celere +2", and in the bottom row a code-like chip
"top3 LinkedIn = [Infrastructure, .NET Framework, Infrastructure informatique]" and a round
magenta stamp "PIX · certifié".
```

## 8 · Formation

```text
Design the "Formation" section, SURFACE variant. Section header "05 — Formation".
Three entries, from newest to oldest:
- "Bachelor Coordinateur de projets informatiques" · DIIAGE · "juil. 2025 — août 2026"
- "BTS Services informatiques aux organisations" · Lycée Lamartine · "2023 — 2025"
- "Baccalauréat général · Mathématiques et informatique" · Lycée polyvalent Aiguerande ·
  "sept. 2020 — juin 2023"
Plus one certification line: "PIX — certification des compétences numériques".
Leave empty space between the first two entries and to the right of the list.
Then the X-RAY variant, same layout: a cyan bracket links the BTS and the Bachelor with the note
"enchaînés sans pause", a dark panel decodes acronyms ("CPI = Coordinateur de projets
informatiques", "SIO = Services informatiques aux organisations", "PIX = certification des
compétences numériques") and a mono line at the bottom "sept. 2020 → août 2026 · 6 ans de
formation".
```

## 9 · Sous le capot

```text
Design the "Sous le capot" section, SURFACE variant. Section header "06 — Sous le capot".
In surface mode this section looks like a closed vault: a large calm block with the title
"Il y a plus que ce que vous voyez." and the hint "Ouvrez la loupe pour regarder dedans." plus a
lock or keyhole motif. Most of the block is intentionally empty.
Then the X-RAY variant, same layout: the vault is "open" and shows, in the empty space:
- a diagram: two browser windows exchanging position, size and scroll through a
  "BroadcastChannel" arrow;
- a formula in a code chip: "translate(pivot) scale(z) translate(offset − pivot)";
- live counters: "fenêtres connectées : 2 · loupes : 1".
```

## 10 · Contact et pied de page

```text
Design the "Contact" section and footer, SURFACE variant. Section header "07 — Contact".
- Big invitation: "Une alternance, un projet, une question ?"
- The email as a large link: "baptiste.nodon@gmail.com"
- Secondary link: "LinkedIn ↗"
- Footer: small line "© 2026 Baptiste Nodon" and a "Retour en haut ↑" link.
Leave empty space next to the email and on the right of the footer.
Then the X-RAY variant, same layout: a yellow note next to the email "mentionnez votre score :
7 / 24 secrets" and in the footer a mono signature "fait main · Angular 21 · signals · zéro
zone.js".
```

## 11 · Dock de contrôle (flottant)

```text
Design a floating control dock pinned at the bottom center of the portfolio, over the page.
Pill-shaped, slightly translucent, with 5 buttons:
1. a counter "◎ 3 / 24" that opens the secrets panel;
2. "Rayons X" (toggle, shows the whole page in X-ray);
3. "Loupe intégrée" (toggle, circle lens following the mouse);
4. "Ouvrir la loupe" (primary, opens the lens window);
5. "Singularité" (locked state with a small lock until 24 / 24, then glowing).
Show the dock in 3 states: default, "Rayons X" active, all secrets found (Singularité
unlocked). Show it on top of both the surface page and the X-ray page.
```

## 12 · Panneau des secrets et notification

```text
Design two overlays for the portfolio.
A) A "secrets" popover panel opening above the dock: title "Secrets trouvés", a progress bar
"7 / 24", then the list grouped by section (Accueil, Profil, Parcours, Réalisations,
Compétences, Formation, Sous le capot, Contact). Found secrets show their name with a check
(e.g. "Le tampon « pas censé voir ça »"), the others show "???" and a dim dot. Footer buttons:
"Réinitialiser" and "Fermer".
B) A small toast that slides in when a secret is found: "Secret trouvé — Le compteur
d'alternance · 8 / 24", with a variant "trouvé depuis la loupe".
```

## 13 · Loupe intégrée

```text
Design the in-page lens mode of the portfolio: the surface page (hero + start of "Profil") with
a circular lens of about 220px following the mouse. Inside the circle the X-ray version of the
exact same area is visible (dark blueprint, outlines, a hidden yellow note half visible). The
circle has a thin cyan ring, a progress arc that fills while a secret is being scanned, and a
small label "Maj + molette : zoom · Échap : fermer". Also show a faint glowing frame on the page
where an external lens window is currently placed.
```

## 14 · Fenêtre loupe (popup 480 × 380)

```text
Design the content of a small separate browser popup window (480x380px) that acts as an X-ray
magnifier placed over the portfolio. It shows the X-ray page underneath plus a HUD overlay:
- corner brackets, a subtle moving scanline and a vignette;
- a center reticle with a circular progress ring;
- top left: zoom "×1.0"; top right: 5 signal bars (Geiger-style proximity detector);
- bottom left: counter "◎ 7 / 24"; bottom right: a sound toggle "♪ son" and a "?" help button;
- a toast "Secret trouvé — La carte du parcours".
Also design 3 other states of this same window:
1. "searching": no portfolio found under the window, dark screen with the message
   "Placez la loupe au-dessus du portfolio";
2. "off": the portfolio window is closed, message "Portfolio introuvable — rouvrez-le";
3. help overlay listing: "Molette : faire défiler", "Maj + molette ou + / − / 0 : zoom",
   "M : son", "Flèches, Page ↑ / ↓, Espace : défiler".
```

## 15 · Singularité (écran final)

```text
Design a full-screen finale overlay called "Singularité", unlocked when all 24 secrets are
found. Pitch black space, a glowing black hole in the center with an accretion disk (warm
orange and white), gravitational lensing, a photon ring and luminous helix streams going out of
the frame (as if heading to another window's black hole). Minimal UI: top left a mono label
"24 / 24 · singularité", bottom center a small line "chaque fenêtre ouverte devient un trou noir
— approchez-les", top right a "Fermer ✕" button. Cinematic, no other content.
```

## 16 · Version mobile — surface

```text
Switch to Mobile (390px wide). Recreate the full portfolio page in the SURFACE variant as one
long scrolling screen: navigation collapsed into a menu button, hero, Profil, Parcours (timeline
in one column, the map aside goes below), Réalisations (cards stacked), Compétences (groups
stacked), Formation, Sous le capot, Contact, footer. The control dock becomes a compact bar at
the bottom with: counter, "Rayons X", "Loupe" (in-page lens, dragged with the finger).
```

## 17 · Version mobile — rayons X et loupe au doigt

```text
Edit the mobile screen into its X-RAY variant with the same layout. Then add a second mobile
screen showing the in-page lens on touch: the surface page with a circular lens dragged under
the user's finger, a small handle below the circle and the X-ray content visible inside it.
```

---

## Variantes de direction artistique (optionnel)

Pour changer d'ambiance, remplace le bloc « Art direction » du prompt 0 par l'un de ceux-ci.

**A · Brutaliste technique**

```text
Art direction: neo-brutalist. Pure white surface, thick black borders, flat bright accent
(electric yellow), heavy grotesque display type, mono everywhere else, visible grid, hard
shadows. X-ray: black background, phosphor green outlines like an old CRT terminal, amber
notes, red stamps.
```

**B · Laboratoire / photographie argentique**

```text
Art direction: darkroom lab. Surface in warm greys and cream like a photo contact sheet, film
frame borders, serif italic headings, small typed captions. X-ray: deep red safelight
background, white negative-film outlines, yellow grease-pencil notes, cyan stamps.
```

**C · Sombre et néon**

```text
Art direction: dark premium. Surface in deep charcoal with soft gradients, large clean sans
display type, glassmorphism cards, one violet accent. X-ray: pure black, thin cyan and magenta
neon outlines, scanlines, yellow notes. Keep strong contrast in both variants.
```

---

## Checklist de retour

| # | Vue | Surface | Rayons X |
| --- | --- | --- | --- |
| 0 | Système de design | ☐ | ☐ |
| 1 | Navigation | ☐ | ☐ |
| 2–3 | Accueil | ☐ | ☐ |
| 4 | Profil | ☐ | ☐ |
| 5 | Parcours | ☐ | ☐ |
| 6 | Réalisations | ☐ | ☐ |
| 7 | Compétences | ☐ | ☐ |
| 8 | Formation | ☐ | ☐ |
| 9 | Sous le capot | ☐ | ☐ |
| 10 | Contact et pied de page | ☐ | ☐ |
| 11 | Dock de contrôle (3 états) | ☐ | ☐ |
| 12 | Panneau des secrets + toast | ☐ | — |
| 13 | Loupe intégrée | ☐ | — |
| 14 | Fenêtre loupe (4 états) | — | ☐ |
| 15 | Singularité | ☐ | — |
| 16–17 | Mobile | ☐ | ☐ |
