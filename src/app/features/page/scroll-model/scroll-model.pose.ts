/** Les deux formes à l'essai ; `?forme=bn` ou `?forme=constellation` dans l'adresse choisit. */
export type ModelForm = 'constellation' | 'bn';

export const parseForm = (value: string | null | undefined): ModelForm | null =>
  value === 'bn' || value === 'constellation' ? value : null;

/** Où en est la forme pour un défilement donné : tout en découle, donc la loupe voit la même chose. */
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

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function modelPose(form: ModelForm, scrollY: number, vh: number, pageWidth: number, pageHeight: number): ModelPose {
  const p = clamp01(scrollY / Math.max(1, pageHeight - vh));
  const side = Math.min(pageWidth * 0.36, vh * 0.62);
  const appear = clamp01((scrollY - vh * 0.25) / (vh * 0.5));
  const y = (vh - side) * 0.55;
  if (form === 'bn') {
    // Exactement de face à un seul instant : le monogramme doit tenir en entier dans la page.
    const gap = p - BN_ALIGNED_AT;
    const near = clamp01(1 - Math.abs(gap) / 0.03);
    return { side, x: pageWidth - side * 1.04, y, appear, turn: gap * 2 * Math.PI * 1.6, tilt: gap * Math.PI * 0.8, glow: near * near * (3 - 2 * near) };
  }
  // À demeure contre le bord droit, à moitié hors de la page : seule sa rotation suit le défilement.
  return { side, x: pageWidth - side * 0.62, y, appear, turn: 0.6 + p * 2 * Math.PI, tilt: 0.28 + 0.08 * Math.sin(p * 2 * Math.PI), glow: 0 };
}
