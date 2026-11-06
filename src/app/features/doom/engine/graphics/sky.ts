import { RAMP, ink } from '../color/palette';
import { WallTex } from './graphics.model';
import { hash } from './noise';

/** Bruit lissé qui boucle tous les 256 pixels : le ciel fait le tour sans couture. */
function cloud(x: number, y: number): number {
  const octave = (cell: number, wrap: number, seed: number) => {
    const fx = x / cell;
    const fy = y / (cell / 2);
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const s = (t: number) => t * t * (3 - 2 * t);
    const at = (a: number, b: number) => hash(((a % wrap) + wrap) % wrap, b, seed);
    const top = at(i, j) + (at(i + 1, j) - at(i, j)) * s(tx);
    const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * s(tx);
    return top + (bottom - top) * s(ty);
  };
  return octave(32, 8, 19) * 0.65 + octave(16, 16, 20) * 0.35;
}

/**
 * Le ciel : 256 colonnes pour un quart de tour, comme dans Doom (il revient quatre fois par tour),
 * une ligne de texture par ligne d'écran. Des nuages, un dégradé, des collines à l'horizon.
 */
export function buildSky(): WallTex {
  const width = 256;
  const height = 200;
  const data = new Uint8Array(width * height);
  for (let x = 0; x < width; x++) {
    const t = (x / width) * Math.PI * 2;
    const hill = 118 + 9 * Math.sin(t * 3) + 5 * Math.sin(t * 7 + 1.3);
    for (let y = 0; y < height; y++) {
      let color: number;
      if (y >= hill) color = ink(RAMP.NIGHT, Math.min(10, 6 + Math.floor((y - hill) / 8)));
      else {
        const c = cloud(x, y);
        color = y < 100 && c > 0.62 ? ink(RAMP.MIST, c > 0.72 ? 1 : 3) : ink(RAMP.ACCENT, Math.round(9 - Math.min(1, y / 118) * 7));
      }
      data[x * height + y] = color;
    }
  }
  return { width, height, data };
}
