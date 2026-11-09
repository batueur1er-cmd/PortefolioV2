import { RAMP, ink } from '../color/palette';
import { WallTexture } from '../level/level-data';
import { WallTex } from './graphics.model';
import { grain, hash } from './noise';

/** Les textures des murs, dessinées en code dans la palette (rien n'est copié de Doom). */

const R = RAMP;

function wall(width: number, height: number, paint: (x: number, y: number) => number): WallTex {
  const data = new Uint8Array(width * height);
  for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) data[x * height + y] = paint(x, y);
  return { width, height, data };
}

const LETTERS: Record<'B' | 'N', readonly string[]> = {
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
};

/** Le pixel (x, y) tombe-t-il dans une lettre de 5 × 7 cases de 5 pixels, posée en (left, top) ? */
const inLetter = (letter: 'B' | 'N', left: number, top: number, x: number, y: number): boolean => {
  const gx = Math.floor((x - left) / 5);
  const gy = Math.floor((y - top) / 5);
  return gx >= 0 && gx < 5 && gy >= 0 && gy < 7 && LETTERS[letter][gy][gx] === '1';
};

export function buildWalls(): Record<WallTexture, WallTex> {
  return {
    panneaux: wall(64, 128, (x, y) => {
      const px = x & 31;
      const py = y & 63;
      if (y >= 56 && y < 60) return ink(R.ACCENT, y === 56 ? 2 : 4);
      if (px === 0 || py === 0) return ink(R.MIST, 9);
      if (px === 1 || py === 1) return ink(R.MIST, 1);
      if ((px === 5 || px === 26) && (py === 5 || py === 50)) return ink(R.GREY, 6);
      return ink(R.MIST, 4 + grain(x, y, 1, 0.06) + (py > 40 ? 1 : 0));
    }),
    briques: wall(64, 128, (x, y) => {
      const row = y >> 3;
      const off = row & 1 ? 8 : 0;
      const bx = (x + off) & 15;
      const by = y & 7;
      if (by === 7 || bx === 15) return ink(R.SAND, 8);
      const id = ((x + off) >> 4) + row * 5;
      return ink(R.FLAME, 5 + Math.floor(hash(id, row, 2) * 3) - (by === 0 ? 1 : 0) + grain(x, y, 3, 0.15));
    }),
    pierre: wall(64, 128, (x, y) => {
      const row = y >> 4;
      const off = row & 1 ? 16 : 0;
      const bx = (x + off) & 31;
      const by = y & 15;
      if (bx === 31 || by === 15) return ink(R.NIGHT, 6);
      const id = ((x + off) >> 5) + row * 3;
      return ink(R.MIST, 6 + Math.floor(hash(id, row, 4) * 3) - (by === 0 || bx === 0 ? 1 : 0) + grain(x, y, 5, 0.06));
    }),
    metal: wall(64, 128, (x, y) => {
      const rx = x & 7;
      if ((y & 31) === 0) return ink(R.BLUE, 10);
      if ((y & 31) === 1) return ink(R.BLUE, 2);
      if (rx === 0) return ink(R.BLUE, 1);
      if (rx === 1) return ink(R.BLUE, 3);
      if (rx === 7) return ink(R.BLUE, 9);
      return ink(R.BLUE, 5 + grain(x, y, 6, 0.12));
    }),
    // L'enseigne du hall : le monogramme du portfolio.
    logo: wall(128, 128, (x, y) => {
      if (x < 4 || x >= 124 || y < 4 || y >= 124) return ink(R.MIST, x < 2 || y < 2 || x >= 126 || y >= 126 ? 9 : 3);
      if (inLetter('B', 34, 44, x, y) || inLetter('N', 69, 44, x, y)) return ink(R.GREY, 2);
      if (inLetter('B', 34, 44, x - 2, y - 2) || inLetter('N', 69, 44, x - 2, y - 2)) return ink(R.ACCENT, 11);
      if (y >= 90 && y < 92 && x >= 34 && x < 94) return ink(R.GOLD, 2);
      return ink(R.ACCENT, 4 + (y > 64 ? 1 : 0) + grain(x, y, 7, 0.1));
    }),
    // Contremarche : un nez de marche doré, puis la pierre.
    marche: wall(64, 16, (x, y) =>
      y < 2 ? ink(R.GOLD, y === 0 ? 2 : 4) : ink(R.MUTED, 4 + (y > 12 ? 2 : 0) + grain(x, y, 8, 0.2)),
    ),
    // Le battant d'une porte : des lames d'acier, une bande d'avertissement et des rivets.
    porte: wall(64, 128, (x, y) => {
      if (y >= 56 && y < 72) return (x + y) & 8 ? ink(R.GOLD, 3) : ink(R.NIGHT, 8);
      if ((y & 15) === 15) return ink(R.BLUE, 11);
      if ((y & 15) === 0) return ink(R.BLUE, 2);
      if ((x === 6 || x === 57) && (y & 15) === 8) return ink(R.MIST, 2);
      return ink(R.BLUE, 6 + grain(x, y, 10, 0.1));
    }),
    cadre: wall(64, 64, (x, y) => ink(R.GOLD, 8 + Math.round(Math.sin(x * 0.8 + Math.sin(y * 0.15) * 2) * 1.5) + grain(x, y, 9, 0.1))),
  };
}
