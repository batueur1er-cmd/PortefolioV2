import { DoomPresence } from '@core/sync/window-bus';

import type { FrameStats } from '../engine/engine';

/** Adresse de la démo : déclarée dans app.routes.ts, annoncée par le projet, attendue par la loupe. */
export const DOOM_PATH = '/projets/doom/demo';
export const DOOM_PROJECT = 'doom';

/** Durée d'une image dessinée au ralenti, du premier mur au dernier objet. */
export const REPLAY_MS = 8000;

export type ReplayState = 'live' | 'playing' | 'paused';
export type ReplayPhase = 'murs' | 'sols' | 'objets' | 'peintre' | 'fini';
export type PadAction = 'avancer' | 'reculer' | 'gauche' | 'droite' | 'pas-gauche' | 'pas-droite';

/** Ce que montre chaque étape du rendu au ralenti : en clair, puis dans le code de Doom. */
export const PHASES: Readonly<Record<ReplayPhase, { readonly plain: string; readonly tech: string }>> = {
  murs: { plain: 'Les murs, du plus proche au plus lointain', tech: 'R_RenderBSPNode → R_StoreWallRange → R_DrawColumn' },
  sols: { plain: 'Les sols et les plafonds, ligne par ligne', tech: 'R_DrawPlanes → R_MakeSpans → R_MapPlane' },
  objets: { plain: 'Les objets, du plus loin au plus proche', tech: 'R_DrawMasked → R_SortVisSprites → R_DrawSprite' },
  peintre: { plain: 'Du fond vers l’avant : chaque surface recouvre la précédente', tech: 'Algorithme du peintre : BSP à l’envers, sans solidsegs ni visplanes' },
  fini: { plain: 'L’image est terminée', tech: 'R_RenderPlayerView : image complète' },
};

const COMPASS = ['l’est', 'le nord-est', 'le nord', 'le nord-ouest', 'l’ouest', 'le sud-ouest', 'le sud', 'le sud-est'];

/** La direction du regard, en clair (« le nord-est »). */
export function heading(angle: number): string {
  const k = Math.round(angle / (Math.PI / 4));
  return COMPASS[((k % 8) + 8) % 8];
}

/** L'angle en degrés, de 0 à 359. */
export function degrees(angle: number): number {
  return ((Math.round((angle * 180) / Math.PI) % 360) + 360) % 360;
}

/** Où en est le dessin d'une image, après `done` opérations. */
export function phaseOf(stats: Pick<FrameStats, 'wallOps' | 'planeOps' | 'ops'>, done: number): ReplayPhase {
  if (done < stats.wallOps) return 'murs';
  if (done < stats.wallOps + stats.planeOps) return 'sols';
  return done < stats.ops ? 'objets' : 'fini';
}

/** Les compteurs d'une image, affichés sous la vue. */
export interface FrameCounts {
  readonly subsectors: number;
  readonly walls: number;
  readonly visplanes: number;
  readonly sprites: number;
  readonly culled: number;
  readonly ops: number;
  /** Pixels écrits, en comptant ceux écrits plusieurs fois. */
  readonly pixels: number;
}

export const NO_COUNTS: FrameCounts = { subsectors: 0, walls: 0, visplanes: 0, sprites: 0, culled: 0, ops: 0, pixels: 0 };

/** Le nombre de pixels de l'écran : au-delà, on a peint pour rien. */
export const SCREEN_PIXELS = 320 * 200;

export function countsOf(stats: FrameStats): FrameCounts {
  return {
    subsectors: stats.subsectors,
    walls: stats.walls,
    visplanes: stats.visplanes,
    sprites: stats.sprites,
    culled: stats.culled,
    ops: stats.ops,
    pixels: stats.pixels,
  };
}

export const sameCounts = (a: FrameCounts, b: FrameCounts): boolean =>
  a.subsectors === b.subsectors &&
  a.walls === b.walls &&
  a.visplanes === b.visplanes &&
  a.sprites === b.sprites &&
  a.culled === b.culled &&
  a.ops === b.ops &&
  a.pixels === b.pixels;

/** Deux états de la démo qui donnent la même image. */
export function sameDoom(a: DoomPresence | null, b: DoomPresence | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.z === b.z &&
    a.angle === b.angle &&
    a.fov === b.fov &&
    a.tic === b.tic &&
    a.bsp === b.bsp &&
    a.painter === b.painter &&
    a.doors.length === b.doors.length &&
    a.doors.every((h, i) => h === b.doors[i]) &&
    a.replay?.done === b.replay?.done &&
    a.replay?.total === b.replay?.total &&
    a.replay?.playing === b.replay?.playing
  );
}
