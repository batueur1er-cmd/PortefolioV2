import { Size } from '../geometry/geometry';

/**
 * Taille en dessous de laquelle une fenêtre peut devenir une loupe. Ce seuil fait partie du
 * protocole entre fenêtres : chacune annonce si elle est « petite », toutes doivent donc
 * appliquer la même règle.
 */
export const LENS_WINDOW = {
  maxWidth: 680,
  maxHeight: 620,
  /** Marge de sortie : une fenêtre redimensionnée pile sur le seuil ne clignote pas. */
  hysteresis: 32,
} as const;

/** Vrai si la fenêtre est assez petite pour servir de loupe. */
export function isLensSized(viewport: Size, wasLensSized = false): boolean {
  const slack = wasLensSized ? LENS_WINDOW.hysteresis : 0;
  return viewport.w <= LENS_WINDOW.maxWidth + slack && viewport.h <= LENS_WINDOW.maxHeight + slack;
}
