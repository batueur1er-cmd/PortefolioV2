/*
 * L'écran de Doom n'a que 256 couleurs (la palette PLAYPAL). Pour assombrir un pixel, le moteur ne
 * calcule rien : il lit la couleur de remplacement dans une table (le COLORMAP), une par niveau
 * d'ombre. Ici, la palette est tirée des couleurs du thème : 16 teintes de 16 nuances chacune.
 */

export type Rgb = readonly [number, number, number];

/** Les 16 teintes de la palette, dans l'ordre : chacune occupe 16 cases (de la plus claire à la plus sombre). */
export const RAMP = {
  GREY: 0,
  MIST: 1,
  NIGHT: 2,
  SAND: 3,
  FLAME: 4,
  GOLD: 5,
  FOREST: 6,
  TEAL: 7,
  BLUE: 8,
  PINK: 9,
  MINT: 10,
  ACCENT: 11,
  ACCENT2: 12,
  MUTED: 13,
  PLUM: 14,
  INK: 15,
} as const;

/** Les variables CSS qui donnent chaque teinte (même ordre que RAMP), avec leur valeur du thème clair. */
export const RAMP_COLORS: readonly (readonly [variable: string, fallback: string])[] = [
  ['--art-light', '#ffffff'],
  ['--art-mist', '#d9e2ec'],
  ['--art-night', '#2a3a52'],
  ['--art-sand', '#e3d8c8'],
  ['--art-flame', '#e8441c'],
  ['--art-gold', '#f0b35a'],
  ['--art-forest', '#1f4d45'],
  ['--art-teal', '#7fd1c7'],
  ['--art-cube-1', '#3b5bdb'],
  ['--art-cube-2', '#e64980'],
  ['--art-cube-3', '#63e6be'],
  ['--accent', '#4f46e5'],
  ['--accent-2', '#9333ea'],
  ['--muted', '#4b5563'],
  ['--art-plum-2', '#2a1420'],
  ['--ink', '#111827'],
];

const SHADES = 16;

/** Nombre de tables d'ombre, de 0 (pleine lumière) à 31 (presque noir). */
export const COLORMAPS = 32;

/** Une case de la palette : teinte et nuance (0 : la plus claire, 3 : la teinte pure, 15 : presque noire). */
export const ink = (ramp: number, shade: number): number => ramp * SHADES + Math.max(0, Math.min(SHADES - 1, Math.round(shade)));

export interface Palette {
  /** Couleurs prêtes pour un ImageData (octets R, G, B, A). */
  readonly rgba: Uint32Array;
  /** Luminosité de chaque couleur, de 0 à 1. */
  readonly lum: Float32Array;
  /** 32 tables de 256 cases : la couleur à afficher pour chaque couleur et chaque niveau d'ombre. */
  readonly colormaps: Uint8Array;
}

/** Lit une couleur CSS simple (#rgb, #rrggbb, rgb()). */
export function parseColor(value: string, fallback: string): Rgb {
  const read = (text: string): Rgb | null => {
    const v = text.trim();
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)?.[1];
    if (hex) {
      const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
      return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
    }
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
  };
  return read(value) ?? read(fallback) ?? [0, 0, 0];
}

export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Une couleur rangée pour un ImageData (octets R, G, B, A en mémoire). */
export const packRgb = (c: Rgb): number =>
  ((255 << 24) | (Math.round(c[2]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[0])) >>> 0;

export const luminance = (c: Rgb): number => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

/** Les 16 nuances d'une teinte : un peu plus claires, la teinte pure, puis de plus en plus sombres. */
function shadesOf(base: Rgb): Rgb[] {
  const white: Rgb = [255, 255, 255];
  return Array.from({ length: SHADES }, (_, s) => {
    if (s < 3) return mixRgb(base, white, (3 - s) * 0.12);
    const k = 1 - ((s - 3) / (SHADES - 4)) * 0.88;
    return [base[0] * k, base[1] * k, base[2] * k];
  });
}

/**
 * La palette et ses 32 tables d'ombre. Comme pour le COLORMAP de Doom, chaque table remplace une
 * couleur par la couleur de la palette la plus proche de sa version assombrie.
 */
export function buildPalette(bases: readonly Rgb[]): Palette {
  const colors: Rgb[] = [];
  for (let r = 0; r < SHADES; r++) colors.push(...shadesOf(bases[r] ?? [128, 128, 128]));
  const rgba = new Uint32Array(256);
  const lum = new Float32Array(256);
  colors.forEach((c, i) => {
    rgba[i] = packRgb(c);
    lum[i] = luminance(c);
  });
  const colormaps = new Uint8Array(COLORMAPS * 256);
  for (let i = 0; i < 256; i++) colormaps[i] = i;
  for (let level = 1; level < COLORMAPS; level++) {
    const k = 1 - level / COLORMAPS;
    for (let i = 0; i < 256; i++) {
      const [r, g, b] = colors[i];
      const tr = r * k;
      const tg = g * k;
      const tb = b * k;
      let best = 0;
      let bestDistance = Infinity;
      for (let j = 0; j < 256; j++) {
        const c = colors[j];
        const d = 2 * (c[0] - tr) ** 2 + 4 * (c[1] - tg) ** 2 + 3 * (c[2] - tb) ** 2;
        if (d < bestDistance) {
          bestDistance = d;
          best = j;
        }
      }
      colormaps[level * 256 + i] = best;
    }
  }
  return { rgba, lum, colormaps };
}
