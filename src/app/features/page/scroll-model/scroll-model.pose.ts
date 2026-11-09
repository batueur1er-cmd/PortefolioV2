/** Où en est l'objet 3D pour un défilement donné : tout en découle, donc la loupe voit la même chose. */
export interface ModelPose {
  /** Taille du canvas carré, et sa place dans la fenêtre (px). */
  readonly side: number;
  readonly x: number;
  readonly y: number;
  /** De 0 à 1 : l'objet apparaît une fois le haut de la page passé. */
  readonly appear: number;
  /** De 0 (assemblé) à 1 (en pièces détachées). */
  readonly explode: number;
  /** Rotation autour de la verticale, inclinaison, et tour des engrenages (radians). */
  readonly turn: number;
  readonly tilt: number;
  readonly spin: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const smooth = (from: number, to: number, v: number): number => {
  const t = clamp01((v - from) / (to - from));
  return t * t * (3 - 2 * t);
};

export function modelPose(scrollY: number, vh: number, pageWidth: number, pageHeight: number): ModelPose {
  const p = clamp01(scrollY / Math.max(1, pageHeight - vh));
  const side = Math.min(pageWidth * 0.42, vh * 0.72);
  return {
    side,
    // Un bord de la page à l'autre, trois traversées sur toute la descente.
    x: (pageWidth - side) * (0.5 + 0.54 * Math.cos(p * 3 * Math.PI)),
    y: (vh - side) * (0.5 + 0.2 * Math.sin(p * 2 * Math.PI)),
    appear: clamp01((scrollY - vh * 0.25) / (vh * 0.5)),
    explode: smooth(0.3, 0.5, p) * (1 - smooth(0.72, 0.9, p)),
    turn: 0.6 + p * 4 * Math.PI,
    tilt: 0.28 + 0.16 * Math.sin(p * 2 * Math.PI),
    spin: p * 40,
  };
}
