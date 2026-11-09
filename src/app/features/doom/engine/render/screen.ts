import { Palette, Rgb, mixRgb, packRgb } from '../color/palette';
import { Frame } from './frame';
import { OWNER, OWNER_SHIFT, SCREEN_H, SCREEN_W } from './render.model';

/** Les couleurs des rayons X, lues dans le thème. */
export interface XrayColors {
  readonly bg: Rgb;
  readonly line: Rgb;
  readonly note: Rgb;
  readonly pink: Rgb;
  readonly text: Rgb;
}

const LEVELS = 8;

/** Une teinte en 8 intensités, du fond rayons X jusqu'à la teinte presque pure. */
const ramp = (bg: Rgb, base: Rgb): number[] =>
  Array.from({ length: LEVELS }, (_, k) => packRgb(mixRgb(bg, base, 0.16 + (k / (LEVELS - 1)) * 0.72)));

/** L'image telle que le joueur la voit : chaque indice de la palette devient sa couleur. */
export function paintSurface(frame: Frame, palette: Palette, out: Uint32Array): void {
  const { pixels } = frame;
  const { rgba } = palette;
  for (let i = 0; i < pixels.length; i++) out[i] = rgba[pixels[i]];
}

/**
 * Carte de chaleur de l'algorithme du peintre : la couleur dit combien de fois chaque pixel a été
 * écrit, du bleu (une fois) au rose vif (huit fois et plus).
 */
export function paintHeat(frame: Frame, colors: XrayColors, out: Uint32Array): void {
  const { overdraw, owner } = frame;
  const heat = Array.from({ length: 9 }, (_, n) =>
    packRgb(n < 3 ? mixRgb(colors.bg, colors.line, 0.25 + n * 0.3) : n < 6 ? mixRgb(colors.line, colors.note, (n - 2) / 3) : mixRgb(colors.note, colors.pink, (n - 5) / 3)),
  );
  const hidden = packRgb(mixRgb(colors.pink, colors.text, 0.5));
  for (let i = 0; i < overdraw.length; i++) {
    out[i] = owner[i] >> OWNER_SHIFT === OWNER.HIDDEN ? hidden : heat[Math.min(8, overdraw[i])];
  }
}

/**
 * La même image aux rayons X : chaque morceau de mur prend une couleur selon son rang de dessin
 * (jaune pour le premier, rose pour le dernier), chaque visplane un bleu, les objets du jaune. Le
 * relief des textures reste visible en transparence et les bords de chaque morceau sont tracés.
 */
export function paintXray(frame: Frame, palette: Palette, colors: XrayColors, walls: number, out: Uint32Array): void {
  const { pixels, owner } = frame;
  const { lum } = palette;
  const wallRamps = new Uint32Array(Math.max(1, walls) * LEVELS);
  for (let d = 0; d < walls; d++) {
    wallRamps.set(ramp(colors.bg, mixRgb(colors.note, colors.pink, walls > 1 ? d / (walls - 1) : 0)), d * LEVELS);
  }
  const planes = [...ramp(colors.bg, colors.line), ...ramp(colors.bg, mixRgb(colors.line, colors.text, 0.45))];
  const sprites = ramp(colors.bg, colors.note);
  const hidden = ramp(colors.bg, mixRgb(colors.pink, colors.text, 0.2));
  const sky = packRgb(mixRgb(colors.bg, colors.line, 0.1));
  const edge = packRgb(mixRgb(colors.bg, colors.text, 0.92));
  const empty = packRgb(colors.bg);
  for (let y = 0, i = 0; y < SCREEN_H; y++) {
    for (let x = 0; x < SCREEN_W; x++, i++) {
      const o = owner[i];
      if (!o) {
        out[i] = empty;
        continue;
      }
      if ((x < SCREEN_W - 1 && owner[i + 1] !== o) || (y < SCREEN_H - 1 && owner[i + SCREEN_W] !== o)) {
        out[i] = edge;
        continue;
      }
      const id = o & 0xfff;
      const k = Math.min(LEVELS - 1, Math.floor(lum[pixels[i]] * LEVELS));
      switch (o >> OWNER_SHIFT) {
        case OWNER.WALL:
          out[i] = wallRamps[Math.min(Math.max(0, walls - 1), id) * LEVELS + k];
          break;
        case OWNER.PLANE:
          out[i] = planes[(id & 1) * LEVELS + k];
          break;
        case OWNER.SKY:
          out[i] = sky;
          break;
        case OWNER.HIDDEN:
          out[i] = hidden[Math.min(LEVELS - 1, k + 3)];
          break;
        default:
          out[i] = sprites[k];
      }
    }
  }
}
