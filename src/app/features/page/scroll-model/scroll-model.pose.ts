/** Où en est le monogramme pour un défilement donné : tout en découle, donc la loupe voit la même chose. */
export interface ModelPose {
  /** Taille du canvas carré, et sa place dans la fenêtre (px). */
  readonly side: number;
  readonly x: number;
  readonly y: number;
  /** De 0 à 1 : la forme apparaît une fois le haut de la page passé. */
  readonly appear: number;
  /** Rotation autour de la verticale et inclinaison (radians). */
  readonly turn: number;
  readonly tilt: number;
  /** De 0 à 1 : le monogramme est en train de se former. */
  readonly glow: number;
}

/** L'instant de la descente où les traits s'alignent et forment « BN ». */
export const BN_ALIGNED_AT = 0.93;
/** De combien de part et d'autre de cet instant le monogramme commence à ressortir (fraction de la page). */
const GLOW_RANGE = 0.04;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function modelPose(scrollY: number, vh: number, pageWidth: number, pageHeight: number): ModelPose {
  const p = clamp01(scrollY / Math.max(1, pageHeight - vh));
  const side = Math.min(pageWidth * 0.36, vh * 0.62);
  // Exactement de face à un seul instant : le monogramme doit tenir en entier dans la page.
  const gap = p - BN_ALIGNED_AT;
  const near = clamp01(1 - Math.abs(gap) / GLOW_RANGE);
  return {
    side,
    x: pageWidth - side * 1.04,
    y: (vh - side) * 0.55,
    appear: clamp01((scrollY - vh * 0.25) / (vh * 0.5)),
    turn: gap * 2 * Math.PI * 1.6,
    tilt: gap * Math.PI * 0.8,
    glow: near * near * (3 - 2 * near),
  };
}
