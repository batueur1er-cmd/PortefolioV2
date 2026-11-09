/*
 * Le petit niveau de la démo, décrit comme dans un éditeur de cartes de l'époque : des secteurs
 * (des pièces) dessinés vus de dessus, avec leurs hauteurs de sol et de plafond, leurs textures et
 * leur lumière, puis les objets posés dessus. Unités de Doom : le joueur fait 56 de haut et 32 de
 * large, ses yeux sont à 41 au-dessus du sol, et il franchit les marches de 24 au plus.
 *
 * Le niveau est original : seules la façon de le décrire et celle de le dessiner viennent de Doom.
 */

export type WallTexture = 'panneaux' | 'briques' | 'pierre' | 'metal' | 'logo' | 'marche' | 'cadre' | 'porte';
export type FlatTexture = 'dalles' | 'plafond' | 'paves' | 'herbe' | 'eau' | 'beton' | 'voute' | 'bois';
export type ThingKind = 'lampe' | 'plante' | 'robot' | 'brasero' | 'coffre';

/** Un point du contour d'un secteur ; `wall` change la texture du mur qui part de ce point. */
export type MapPoint = readonly [x: number, y: number, wall?: WallTexture];

export interface SectorDef {
  readonly id: string;
  /** La pièce à laquelle appartient le secteur, affichée sous la vue. */
  readonly room: string;
  readonly floor: number;
  readonly ceiling: number;
  readonly floorFlat: FlatTexture;
  /** null : le plafond est le ciel. */
  readonly ceilingFlat: FlatTexture | null;
  /** De 0 (noir) à 255 (plein jour). */
  readonly light: number;
  /** Lumière qui vacille entre `light` et `dimLight`. */
  readonly dimLight?: number;
  /** Murs pleins ; `upper` et `lower` : les bandes au-dessus et au-dessous d'une ouverture. */
  readonly wall: WallTexture;
  readonly upper?: WallTexture;
  readonly lower?: WallTexture;
  /** Une porte : un secteur fermé (plafond posé sur le sol) dont seul le plafond bouge, avec la texture de son battant. */
  readonly door?: WallTexture;
  readonly outline: readonly MapPoint[];
  /** Trous dans le secteur (piliers, ou un autre secteur posé dedans), avec leur texture. */
  readonly holes?: readonly { readonly wall: WallTexture; readonly points: readonly MapPoint[] }[];
}

export interface ThingDef {
  readonly kind: ThingKind;
  readonly x: number;
  readonly y: number;
  /** Direction du regard, en degrés (0 : l'est, 90 : le nord). */
  readonly angle?: number;
  /** Caché dans l'épaisseur d'un mur, hors de tout secteur : seuls les rayons X le montrent. */
  readonly hidden?: boolean;
  /** Hauteur du sol sous l'objet, pour un objet posé hors des secteurs. */
  readonly floor?: number;
}

/** Un rectangle, de (x0, y0) à (x1, y1). */
export const rect = (x0: number, y0: number, x1: number, y1: number): MapPoint[] => [
  [x0, y0],
  [x0, y1],
  [x1, y1],
  [x1, y0],
];

const step = (n: number, y0: number): SectorDef => ({
  id: `marche-${n}`,
  room: 'L’escalier',
  floor: 16 * n,
  ceiling: 256,
  floorFlat: 'beton',
  ceilingFlat: 'beton',
  light: 176,
  wall: 'pierre',
  lower: 'marche',
  outline: rect(192, y0, 448, y0 + 48),
});

const pillar = (x: number, y: number) => ({ wall: 'metal' as const, points: rect(x, y, x + 64, y + 64) });

/*
 * Le damier, la salle piégée : 160 petites cases, chacune avec sa propre lumière. Des lumières
 * différentes interdisent de partager un visplane, et l'image dépasse la limite de 128 de Doom.
 */
const CHECKER_CELL = 24;
const checker = (): SectorDef[] =>
  Array.from({ length: 160 }, (_, n) => {
    const col = n % 16;
    const row = Math.floor(n / 16);
    const odd = (col + row) % 2 === 1;
    const x = 64 + col * CHECKER_CELL;
    const y = 976 + row * CHECKER_CELL;
    return {
      id: `damier-${n}`,
      room: 'Le damier',
      floor: odd ? -28 : -32,
      ceiling: odd ? 104 : 96,
      floorFlat: odd ? 'beton' : 'dalles',
      ceilingFlat: odd ? 'beton' : 'plafond',
      light: 96 + n,
      wall: 'briques',
      lower: 'marche',
      outline: rect(x, y, x + CHECKER_CELL, y + CHECKER_CELL),
    };
  });

export const SECTORS: readonly SectorDef[] = [
  {
    id: 'hall',
    room: 'Le hall',
    floor: 0,
    ceiling: 176,
    floorFlat: 'dalles',
    ceilingFlat: 'plafond',
    light: 192,
    wall: 'panneaux',
    // Le mur est porte l'enseigne « BN », entre le couloir et l'angle nord.
    outline: [[0, 0], [0, 512], [640, 512], [640, 480, 'logo'], [640, 352], [640, 0]],
    holes: [{ wall: 'pierre', points: rect(288, 224, 352, 288) }],
  },
  {
    id: 'couloir',
    room: 'Le couloir',
    floor: 0,
    ceiling: 128,
    floorFlat: 'paves',
    ceilingFlat: 'beton',
    light: 176,
    dimLight: 96,
    wall: 'pierre',
    outline: rect(640, 192, 800, 320),
  },
  // Une porte, comme dans Doom : un secteur dont le plafond monte. Ni le plan ni l'arbre ne changent.
  {
    id: 'porte-couloir',
    room: 'Le couloir',
    floor: 0,
    ceiling: 0,
    floorFlat: 'paves',
    ceilingFlat: 'beton',
    light: 176,
    wall: 'cadre',
    door: 'porte',
    outline: rect(800, 192, 832, 320),
  },
  {
    id: 'couloir-2',
    room: 'Le couloir',
    floor: 0,
    ceiling: 128,
    floorFlat: 'paves',
    ceilingFlat: 'beton',
    light: 176,
    dimLight: 96,
    wall: 'pierre',
    outline: rect(832, 192, 896, 320),
  },
  {
    id: 'colonnes',
    room: 'La salle des colonnes',
    floor: 0,
    ceiling: 224,
    floorFlat: 'paves',
    ceilingFlat: 'voute',
    light: 160,
    wall: 'briques',
    outline: rect(896, 0, 1408, 512),
    holes: [pillar(1024, 128), pillar(1216, 128), pillar(1024, 320), pillar(1216, 320)],
  },
  step(1, 512),
  step(2, 560),
  step(3, 608),
  step(4, 656),
  {
    id: 'balcon',
    room: 'Le balcon',
    floor: 64,
    ceiling: 256,
    floorFlat: 'bois',
    ceilingFlat: 'beton',
    light: 176,
    wall: 'pierre',
    outline: rect(192, 704, 448, 960),
  },
  // La fenêtre : un secteur dans l'épaisseur du mur, au sol relevé et au plafond abaissé.
  {
    id: 'fenetre',
    room: 'Le balcon',
    floor: 96,
    ceiling: 176,
    floorFlat: 'bois',
    ceilingFlat: 'bois',
    light: 176,
    wall: 'cadre',
    outline: rect(448, 800, 480, 864),
  },
  {
    id: 'cour',
    room: 'La cour',
    floor: -32,
    ceiling: 288,
    floorFlat: 'herbe',
    ceilingFlat: null,
    light: 224,
    wall: 'pierre',
    outline: rect(480, 640, 1408, 1216),
    holes: [{ wall: 'pierre', points: rect(832, 832, 1024, 1024) }],
  },
  {
    id: 'bassin',
    room: 'La cour',
    floor: -56,
    ceiling: 288,
    floorFlat: 'eau',
    ceilingFlat: null,
    light: 224,
    wall: 'pierre',
    outline: rect(832, 832, 1024, 1024),
  },
  // La porte du damier, dans le mur ouest de la cour. Comme une porte s'arrête au plafond voisin,
  // un petit renfoncement au plafond bas lui donne sa hauteur : au-dessus, le mur de la cour continue.
  {
    id: 'linteau-damier',
    room: 'La cour',
    floor: -32,
    ceiling: 96,
    floorFlat: 'paves',
    ceilingFlat: 'beton',
    light: 200,
    wall: 'cadre',
    outline: rect(464, 1072, 480, 1120),
  },
  {
    id: 'porte-damier',
    room: 'La cour',
    floor: -32,
    ceiling: -32,
    floorFlat: 'paves',
    ceilingFlat: 'beton',
    light: 200,
    wall: 'cadre',
    door: 'porte',
    outline: rect(448, 1072, 464, 1120),
  },
  ...checker(),
  {
    id: 'passage-1',
    room: 'Le passage',
    floor: -16,
    ceiling: 160,
    floorFlat: 'paves',
    ceilingFlat: 'voute',
    light: 160,
    wall: 'briques',
    lower: 'marche',
    outline: rect(1216, 512, 1344, 576),
  },
  {
    id: 'passage-2',
    room: 'Le passage',
    floor: -32,
    ceiling: 160,
    floorFlat: 'paves',
    ceilingFlat: 'voute',
    light: 160,
    wall: 'briques',
    lower: 'marche',
    outline: rect(1216, 576, 1344, 592),
  },
  {
    id: 'linteau-passage-1',
    room: 'Le passage',
    floor: -32,
    ceiling: 96,
    floorFlat: 'paves',
    ceilingFlat: 'voute',
    light: 160,
    wall: 'cadre',
    outline: rect(1216, 592, 1344, 608),
  },
  {
    id: 'linteau-passage-2',
    room: 'Le passage',
    floor: -32,
    ceiling: 96,
    floorFlat: 'paves',
    ceilingFlat: 'voute',
    light: 160,
    wall: 'cadre',
    outline: rect(1216, 624, 1344, 640),
  },
  {
    id: 'porte-passage',
    room: 'Le passage',
    floor: -32,
    ceiling: -32,
    floorFlat: 'paves',
    ceilingFlat: 'voute',
    light: 160,
    wall: 'cadre',
    door: 'porte',
    outline: rect(1216, 608, 1344, 624),
  },
];

export const THINGS: readonly ThingDef[] = [
  { kind: 'lampe', x: 560, y: 432 },
  { kind: 'plante', x: 48, y: 464 },
  { kind: 'brasero', x: 1152, y: 256 },
  { kind: 'robot', x: 704, y: 928, angle: 0 },
  { kind: 'plante', x: 544, y: 1152 },
  { kind: 'plante', x: 1344, y: 1152 },
  { kind: 'lampe', x: 1344, y: 704 },
  // Derrière le mur nord du hall, en face du point de départ : aucun mur ne laisse passer la vue.
  { kind: 'coffre', x: 544, y: 584, angle: -90, hidden: true, floor: 0 },
  // Les trois autres : sous le couloir, derrière la salle des colonnes, et à l'ouest du balcon.
  { kind: 'coffre', x: 736, y: 128, angle: 90, hidden: true, floor: 0 },
  { kind: 'coffre', x: 1472, y: 256, angle: 180, hidden: true, floor: 0 },
  { kind: 'coffre', x: 128, y: 832, angle: 0, hidden: true, floor: 64 },
];

/** Le point de départ : dans le hall, tourné vers le nord-est. */
export const START = { x: 96, y: 96, angle: 45 } as const;
