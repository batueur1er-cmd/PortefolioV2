import { COLORMAPS } from './palette';

// Les constantes de la lumière, celles du moteur de Doom.
export const LIGHT_LEVELS = 16;
export const MAX_LIGHT_SCALE = 48;
export const MAX_LIGHT_Z = 128;

export interface LightTables {
  /** Murs et objets : niveau d'ombre selon la lumière (16 niveaux) et l'échelle (48 valeurs). */
  readonly scale: Uint8Array;
  /** Sols et plafonds : selon la lumière et la distance (128 valeurs, par pas de 16 unités). */
  readonly z: Uint8Array;
}

/** Le niveau de lumière d'un secteur (0 à 255) ramené à ses 16 niveaux. */
export const lightBand = (light: number): number => Math.max(0, Math.min(LIGHT_LEVELS - 1, light >> 4));

/**
 * Les tables de lumière, avec les formules de Doom : plus le secteur est sombre, plus on part d'une
 * table sombre ; plus la surface est proche (grande échelle), plus on remonte vers la table 0.
 */
export function buildLightTables(): LightTables {
  const scale = new Uint8Array(LIGHT_LEVELS * MAX_LIGHT_SCALE);
  const z = new Uint8Array(LIGHT_LEVELS * MAX_LIGHT_Z);
  const clampLevel = (level: number) => Math.max(0, Math.min(COLORMAPS - 1, level));
  for (let band = 0; band < LIGHT_LEVELS; band++) {
    const start = ((LIGHT_LEVELS - 1 - band) * 2 * COLORMAPS) / LIGHT_LEVELS;
    for (let j = 0; j < MAX_LIGHT_SCALE; j++) scale[band * MAX_LIGHT_SCALE + j] = clampLevel(start - Math.floor(j / 2));
    for (let j = 0; j < MAX_LIGHT_Z; j++) {
      z[band * MAX_LIGHT_Z + j] = clampLevel(start - Math.floor(Math.floor(160 / (j + 1)) / 2));
    }
  }
  return { scale, z };
}
