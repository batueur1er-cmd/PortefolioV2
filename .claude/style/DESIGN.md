---
version: alpha
name: Révélateur
description: Two-layer portfolio for Baptiste Nodon — a warm editorial surface and an X-ray blueprint layer revealed by a lens, sharing the exact same layout.
colors:
  paper: "#F1ECE3"
  paper-2: "#E7DFD2"
  ink: "#15120F"
  muted: "#625B52"
  accent: "#B5320F"
  on-accent: "#FFFFFF"
  line: "rgba(21, 18, 15, 0.14)"
  status: "#2F8F4E"
  xray-bg: "#06101D"
  xray-grid: "rgba(127, 233, 255, 0.08)"
  xray-line: "#7FE9FF"
  xray-note: "#FFD84D"
  xray-highlight: "#FF5BD0"
  xray-text: "#CFE9F2"
  xray-dim: "rgba(127, 233, 255, 0.35)"
typography:
  display:
    fontFamily: Instrument Serif
    fontSize: 10.5rem
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: -0.03em
  h2:
    fontFamily: Instrument Serif
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter Tight
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  lead:
    fontFamily: Inter Tight
    fontSize: 1.375rem
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: Inter Tight
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.08em
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.4
  note:
    fontFamily: Caveat
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.1
rounded:
  none: 0px
  sm: 4px
  md: 10px
  lg: 18px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 72px
  section: 150px
  gutter: 56px
  max-width: 1200px
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 14px 22px
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 13px 21px
  tag:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 6px 12px
  section-index:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 24px
  control-dock:
    backgroundColor: "rgba(21, 18, 15, 0.86)"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 6px
    height: 52px
  popover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
    width: 380px
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  xray-page:
    backgroundColor: "{colors.xray-bg}"
    textColor: "{colors.xray-text}"
  xray-note:
    backgroundColor: transparent
    textColor: "{colors.xray-note}"
    typography: "{typography.note}"
  xray-stamp:
    backgroundColor: transparent
    textColor: "{colors.xray-highlight}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 8px 12px
  xray-chip:
    backgroundColor: "{colors.xray-bg}"
    textColor: "{colors.xray-line}"
    typography: "{typography.mono}"
    rounded: "{rounded.sm}"
    padding: 4px 8px
  xray-panel:
    backgroundColor: "{colors.xray-bg}"
    textColor: "{colors.xray-text}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: 20px
  lens-hud:
    backgroundColor: transparent
    textColor: "{colors.xray-line}"
    typography: "{typography.label}"
---

## Overview

"Révélateur" is the personal portfolio of Baptiste Nodon, an apprentice software developer
(Bachelor Coordinateur de projets informatiques at DIIAGE, apprenticeship at Quercy
Réfrigération). All copy is in French.

The site has two layers of the same page:

- **Surface**: a warm, confident, editorial portfolio. Paper background, ink text, one rust
  accent, large serif headlines, generous whitespace and numbered sections ("01 — Profil").
- **X-ray**: what the lens reveals. A deep navy blueprint with a faint grid, cyan outlines,
  yellow handwritten notes and magenta stamps. It feels like looking at the construction
  drawings behind the page.

The X-ray layer is shown through a lens: a small separate browser window placed over the
portfolio, or a circle following the mouse. Both layers are rendered at the same time and must
overlap pixel for pixel. **The X-ray variant must never change the layout.** It may only change
colors, outlines, strokes, opacity and backgrounds. Every hidden element lives in an empty space
that is already reserved in the surface layout.

The personality is curious and playful, but precise. It is an engineer's notebook rather than
a flashy agency site.

## Colors

Surface palette:

- **Paper (#F1ECE3):** the main background, a warm off-white like uncoated paper.
- **Paper 2 (#E7DFD2):** a slightly darker paper for tags, alternate bands and cards.
- **Ink (#15120F):** all headings and body text, primary buttons and the control dock.
- **Muted (#625B52):** secondary text, dates, captions and metadata (passes AA on paper).
- **Accent (#B5320F):** a rust red used sparingly for section indexes, links, focus rings and
  hover states. There is one accent only.
- **Line:** a hairline ink at 14% for section dividers and timeline rules.
- **Status (#2F8F4E):** only the small "en alternance" availability dot.

X-ray palette:

- **X-ray background (#06101D):** deep navy, with a 24px blueprint grid in `xray-grid`.
- **X-ray line (#7FE9FF):** cyan for outlined text, wireframes, diagrams, the lens HUD and
  chips.
- **X-ray note (#FFD84D):** yellow, only for handwritten annotations.
- **X-ray highlight (#FF5BD0):** magenta for stamps, the outlined last name and found states.
- **X-ray text (#CFE9F2):** readable body text inside panels.

## Typography

- **Instrument Serif:** display and section titles. The hero name is huge (up to about 168px,
  fluid) with tight leading. In X-ray it becomes a cyan outline, and the last name becomes
  transparent with a magenta stroke.
- **Inter Tight:** body copy, the lead paragraph, roles and company names.
- **JetBrains Mono:** small uppercase labels, section indexes, dates, numbers, chips, the
  control dock, the HUD and code formulas.
- **Caveat:** handwritten notes, used only in the X-ray layer.

Font sizes are fluid, based on the page width through container units. In X-ray they must
always be identical to the surface sizes.

## Layout

- The content is centered with a maximum width of 1200px and fluid gutters (20–56px).
- The grid is asymmetric and editorial: a wide main column plus a narrow aside (for example the
  experience timeline and its sticky "Le fil du parcours" aside).
- Sections are separated by a hairline rule and 84–150px of vertical padding. Each starts with
  a header: a mono index ("02 —") and a serif title.
- Page order: navigation, Accueil (hero), Profil, Parcours, Réalisations, Compétences,
  Formation, Sous le capot, Contact, footer.
- **Reserved empty space:** every section deliberately leaves calm empty areas where X-ray
  elements appear. These include the area beside the hero title, the top right corner, beside
  paragraphs, under key facts, between skill tags (about 26px) and inside the "Sous le capot"
  vault.
- The bottom 120px of the first screen stays clear for the floating control dock.
- On mobile (below 768px) everything collapses to one column, and the aside moves under its
  section.

## Elevation & Depth

The surface is mostly flat, like paper. Depth comes from type scale and whitespace rather
than shadows.

- Only floating UI casts shadows: the control dock, the secrets popover and the toast, with a
  soft and wide shadow (`0 18px 50px rgba(21,18,15,0.18)`).
- In X-ray there are no shadows at all. Depth comes from glow: cyan outlines may have a faint
  `0 0 12px` glow of the same color.
- The lens window HUD has a vignette, corner brackets and a slow scanline, so it feels like an
  optical instrument.

## Shapes

- Buttons, tags and the dock are pills.
- Cards and panels use a 10px radius, and popovers use 18px.
- X-ray stamps are rotated (−6° to 8°) rectangles with a 2px magenta border and slightly
  irregular edges.
- Diagrams and wireframes use 1px cyan strokes, dashed construction lines and small circular
  nodes.
- Decorative surface shapes, such as the hero orb, are soft abstract forms. In X-ray each one
  is replaced by a wireframe of the same size and position.

## Components

- **Navigation:** a small name wordmark on the left, anchor links on the right and a hairline
  bottom rule. In X-ray a mono version chip ("v2.0 · Angular 21 · zoneless") appears under the
  wordmark.
- **Buttons:** the primary button is an ink pill and turns rust on hover. The ghost button has
  a 1px ink outline. In X-ray both become cyan outlines on transparent backgrounds.
- **Tag:** a small mono pill on Paper 2. In X-ray it has a cyan outline with a mono annotation
  underneath ("↳ Celere +2").
- **Timeline entry:** dates in mono and Muted, the role in h3, then the company, city, contract
  type, a one-line summary and tags. In X-ray a thin duration bar and a yellow note appear.
- **Project card:** an abstract illustrated visual on top (built with CSS shapes, no photos),
  then title, context, year, summary and tags. In X-ray the visual becomes a blueprint
  wireframe with a mono chip.
- **Control dock:** a floating ink pill at the bottom center. It holds a counter ("◎ 7 / 24"),
  "Rayons X", "Loupe intégrée", "Ouvrir la loupe" (primary) and "Singularité" (locked until
  24 / 24, then glowing).
- **Secrets popover:** a paper panel with a progress bar and the list grouped by section. Found
  items show a check, and unfound ones show "???".
- **Toast:** an ink chip that slides in with the text "Secret trouvé — <nom> · 8 / 24".
- **X-ray note:** yellow Caveat text, possibly with a hand-drawn arrow.
- **X-ray stamp:** a rotated magenta bordered box with uppercase mono text.
- **X-ray chip:** a small cyan mono label on navy.
- **X-ray panel:** a navy box with a 1px cyan border for maps, decoders and code.
- **In-page lens:** a circle of about 220px showing the X-ray layer. It has a cyan ring and a
  progress arc while a secret is being scanned.
- **Lens window HUD:** corner brackets, a central reticle with a progress ring, the zoom level,
  5 Geiger signal bars, a counter, a sound toggle and help. It also has "searching" and "off"
  states with centered messages.
- **Singularité:** a full-screen black finale with a glowing black hole, an accretion disk,
  a photon ring and light streams. The UI around it is minimal mono text.

## Do's and Don'ts

- Do keep every element at the same position and size in surface and X-ray.
- Do reserve empty space in the surface layout for each hidden element.
- Do use the rust accent sparingly, as a single point of color per view.
- Do keep WCAG AA contrast in both layers, with a visible focus ring (2px rust in surface,
  cyan in X-ray).
- Do write all visible text in French.
- Don't change font sizes, spacing, line breaks or element order in X-ray.
- Don't use photos or stock illustrations. Prefer abstract shapes and diagrams.
- Don't add drop shadows to page content. Only floating UI is elevated.
- Don't use the handwritten font or the neon colors on the surface layer.
- Don't make the surface feel unfinished. Its empty spaces should read as calm editorial
  whitespace.
