import { RAMP, ink } from '../color/palette';
import { FlatTexture } from '../level/level-data';
import { grain, hash } from './noise';

/** Les sols et plafonds : des carrés de 64 × 64, calés sur la grille du niveau. */

const R = RAMP;

function flat(paint: (x: number, y: number) => number): Uint8Array {
  const data = new Uint8Array(64 * 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) data[y * 64 + x] = paint(x, y);
  return data;
}

/** L'eau du bassin, à un moment de sa vague (les deux ondes bouclent tous les 64 pixels). */
const water = (phase: number) =>
  flat((x, y) => {
    const w = Math.sin(((x + y / 2) * Math.PI) / 16 + phase) + Math.sin(((x / 2 - y) * Math.PI) / 16 - phase);
    return ink(R.TEAL, 5 + Math.round(w * 1.4));
  });

export function buildFlats(): Record<FlatTexture, Uint8Array[]> {
  return {
    dalles: [
      flat((x, y) => {
        if ((x & 31) === 0 || (y & 31) === 0) return ink(R.SAND, 9);
        return ink(R.SAND, (((x >> 5) + (y >> 5)) & 1 ? 4 : 6) + grain(x, y, 10, 0.12));
      }),
    ],
    plafond: [
      flat((x, y) => {
        const cx = Math.abs(x - 32);
        const cy = Math.abs(y - 32);
        if (cx < 9 && cy < 9) return ink(R.GOLD, cx < 7 && cy < 7 ? 0 : 3);
        if ((x & 31) === 0 || (y & 31) === 0) return ink(R.MIST, 11);
        return ink(R.MIST, 6 + grain(x, y, 11, 0.04));
      }),
    ],
    paves: [
      flat((x, y) => {
        const row = y >> 4;
        const off = row & 1 ? 8 : 0;
        const bx = (x + off) & 15;
        const by = y & 15;
        if (bx === 0 || by === 0) return ink(R.NIGHT, 8);
        const id = ((x + off) >> 4) + row * 4;
        return ink(R.MIST, 7 + Math.floor(hash(id, row, 12) * 3) - (bx === 1 || by === 1 ? 1 : 0));
      }),
    ],
    herbe: [
      flat((x, y) => {
        const n = hash(x, y, 13);
        if (n < 0.025) return ink(R.MINT, 7);
        return ink(R.FOREST, 1 + Math.floor(hash(x >> 2, y >> 2, 14) * 2) + (n > 0.93 ? 1 : 0));
      }),
    ],
    // Un sol animé : quatre images qui se succèdent.
    eau: [0, 1, 2, 3].map((f) => water((f * Math.PI) / 2)),
    beton: [flat((x, y) => ink(R.GREY, 7 + Math.floor(hash(x >> 3, y >> 3, 15) * 2) + grain(x, y, 16, 0.03)))],
    voute: [
      flat((x, y) =>
        (y & 31) < 4 ? ink(R.NIGHT, 7 + ((y & 31) === 0 ? 1 : 0)) : ink(R.FLAME, 9 + Math.floor(hash(x >> 3, y >> 3, 17) * 2)),
      ),
    ],
    bois: [
      flat((x, y) => {
        const plank = x >> 4;
        if ((x & 15) === 0) return ink(R.GOLD, 12);
        const grainLine = Math.sin(y * 0.3 + plank * 2.1 + Math.sin(x * 0.7) * 0.8);
        return ink(R.GOLD, 8 + Math.round(grainLine) + grain(x, y, 18, 0.08));
      }),
    ],
  };
}
