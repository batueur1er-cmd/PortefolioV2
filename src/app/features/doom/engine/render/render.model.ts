import { RAMP, ink } from '../color/palette';
import { Sector, Seg, Thing } from '../level/level.model';

/** L'image de Doom : 320 × 200 pixels. */
export const SCREEN_W = 320;
export const SCREEN_H = 200;
export const CENTER_X = SCREEN_W / 2;
export const CENTER_Y = SCREEN_H / 2;
/** Distance focale de 160 pixels : un champ de vision de 90°, celui de Doom. */
export const FOCAL = CENTER_X;
export const FOV_HALF = Math.PI / 4;
/** Rien n'est dessiné à moins d'une unité des yeux. */
export const NEAR = 1;

/** Ce qui a peint un pixel, pour la vue rayons X : nature (4 bits) et numéro (12 bits). */
export const OWNER = { WALL: 1, PLANE: 2, SKY: 3, SPRITE: 4 } as const;
export const OWNER_SHIFT = 12;

/** Couleur des pixels pas encore peints (rendu au ralenti). */
export const VOID_COLOR = ink(RAMP.NIGHT, 14);

export interface View {
  readonly x: number;
  readonly y: number;
  /** Hauteur des yeux. */
  readonly z: number;
  /** En radians, 0 vers l'est. */
  readonly angle: number;
  /** Horloge des effets (lumière qui vacille, sols et sprites animés), à 35 tics par seconde. */
  readonly tic: number;
}

export interface FrameStats {
  /** Nœuds de l'arbre parcourus, et sous-arbres écartés par leur boîte englobante. */
  nodes: number;
  culled: number;
  subsectors: number;
  /** Segs examinés, puis plages de mur réellement dessinées (drawsegs). */
  segs: number;
  walls: number;
  visplanes: number;
  spans: number;
  sprites: number;
  /** Opérations de dessin : une colonne de mur, une ligne de sol, une colonne de ciel ou de sprite. */
  ops: number;
  wallOps: number;
  planeOps: number;
  spriteOps: number;
}

export const emptyStats = (): FrameStats => ({
  nodes: 0,
  culled: 0,
  subsectors: 0,
  segs: 0,
  walls: 0,
  visplanes: 0,
  spans: 0,
  sprites: 0,
  ops: 0,
  wallOps: 0,
  planeOps: 0,
  spriteOps: 0,
});

/** Le déroulé d'une image, pour la rejouer au ralenti sur la carte. */
export interface FrameTrace {
  readonly visits: { readonly subsector: number; readonly op: number }[];
  readonly walls: { readonly seg: Seg; readonly x1: number; readonly x2: number; readonly op: number }[];
  readonly planes: { readonly sectors: readonly Sector[]; readonly sky: boolean; readonly op0: number; readonly op1: number }[];
  readonly sprites: { readonly thing: Thing; readonly op0: number; readonly op1: number }[];
}
