import { RAMP, ink } from '../color/palette';
import { ThingKind } from '../level/level-data';
import { Bitmap } from './bitmap';
import { Patch, SpriteDef } from './graphics.model';
import { hash } from './noise';

/** Les objets du niveau : des images plates, dessinées pixel par pixel. */

const R = RAMP;

function lamp(): Patch {
  const b = new Bitmap(16, 72);
  b.rect(4, 0, 11, 1, () => ink(R.NIGHT, 6));
  b.rect(7, 15, 8, 66, (x) => ink(R.GREY, x === 7 ? 7 : 10));
  b.rect(6, 14, 9, 15, () => ink(R.NIGHT, 6));
  b.rect(3, 66, 12, 71, (_x, y) => ink(R.NIGHT, y === 66 ? 3 : 5));
  for (let y = 2; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8.5);
      if (d < 6.5) b.set(x, y, ink(R.GOLD, d < 3 ? 0 : d < 5 ? 1 : 3));
    }
  }
  return b.toPatch(8, 72);
}

function plant(): Patch {
  const b = new Bitmap(36, 48);
  const leaves = [
    [18, 16, 5, 14],
    [10, 20, 4, 11],
    [26, 20, 4, 11],
    [6, 26, 4, 6],
    [30, 26, 4, 6],
    [14, 9, 3, 8],
    [23, 10, 3, 8],
  ] as const;
  for (const [cx, cy, rx, ry] of leaves) {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        b.set(x, y, Math.abs(dx) < 0.18 ? ink(R.MINT, 7) : ink(R.FOREST, dx > 0 ? 3 : 1));
      }
    }
  }
  b.rect(8, 31, 27, 33, () => ink(R.FLAME, 4));
  for (let y = 34; y < 48; y++) {
    const half = 9 - (y - 34) * 0.25;
    b.rect(Math.round(18 - half), y, Math.round(17 + half), y, (x) => ink(R.FLAME, x > 18 ? 7 : 6));
  }
  return b.toPatch(18, 48);
}

function brazier(frame: number): Patch {
  const b = new Bitmap(24, 40);
  for (let x = 3; x <= 20; x++) {
    const edge = 1 - Math.abs(x + 0.5 - 12) / 12;
    const h = (8 + 7 * Math.abs(Math.sin(x * 0.55 + frame * 1.4)) + 5 * hash(x, frame, 20)) * edge;
    for (let y = Math.floor(26 - h); y < 26; y++) {
      const rel = (25 - y) / Math.max(1, h);
      b.set(x, y, rel < 0.35 ? ink(R.GOLD, 0) : rel < 0.6 ? ink(R.GOLD, 2) : rel < 0.85 ? ink(R.FLAME, 3) : ink(R.FLAME, 6));
    }
  }
  for (let y = 26; y < 32; y++) {
    const half = 10 - (y - 26) * 0.8;
    b.rect(Math.round(12 - half), y, Math.round(11 + half), y, (x) => ink(R.NIGHT, y === 26 ? 2 : x > 12 ? 6 : 4));
  }
  b.rect(11, 32, 12, 39, () => ink(R.NIGHT, 7));
  b.rect(7, 38, 16, 39, () => ink(R.NIGHT, 8));
  return b.toPatch(12, 40);
}

interface BoxColors {
  readonly front: number;
  readonly back: number;
  readonly left: number;
  readonly right: number;
}

/**
 * Une boîte vue sous l'angle `alpha` (0 : de face). Le robot regarde vers +x et sa gauche est +y ;
 * le point (x, y) apparaît à l'abscisse -x·sin α + y·cos α depuis le milieu de l'image.
 */
function drawBox(b: Bitmap, alpha: number, ox: number, oy: number, hx: number, hy: number, top: number, bottom: number, colors: BoxColors): void {
  const s = Math.sin(alpha);
  const c = Math.cos(alpha);
  const at = (x: number, y: number) => -x * s + y * c;
  const faces: { a: number; b: number; color: number }[] = [];
  if (c > 0.02) faces.push({ a: at(ox + hx, oy - hy), b: at(ox + hx, oy + hy), color: colors.front });
  if (c < -0.02) faces.push({ a: at(ox - hx, oy - hy), b: at(ox - hx, oy + hy), color: colors.back });
  if (s > 0.02) faces.push({ a: at(ox - hx, oy + hy), b: at(ox + hx, oy + hy), color: colors.left });
  if (s < -0.02) faces.push({ a: at(ox - hx, oy - hy), b: at(ox + hx, oy - hy), color: colors.right });
  const middle = b.width / 2;
  for (let x = 0; x < b.width; x++) {
    const u = x + 0.5 - middle;
    const face = faces.find((f) => u >= Math.min(f.a, f.b) && u < Math.max(f.a, f.b));
    if (face) b.rect(x, top, x, bottom, () => face.color);
  }
}

/** Le robot de la cour, vu sous 8 angles : le moteur choisit l'image selon l'angle entre son regard et le joueur. */
function robot(rotation: number): Patch {
  const b = new Bitmap(32, 56);
  const alpha = (rotation * Math.PI) / 4;
  const s = Math.sin(alpha);
  const c = Math.cos(alpha);
  const middle = 16;
  // Les jambes : la plus lointaine d'abord.
  const legs = [-5, 5].sort((p, q) => p * s - q * s);
  for (const y of legs) {
    drawBox(b, alpha, 0, y, 3, 2.5, 45, 55, { front: ink(R.NIGHT, 5), back: ink(R.NIGHT, 6), left: ink(R.NIGHT, 6), right: ink(R.NIGHT, 7) });
  }
  drawBox(b, alpha, 0, 0, 7, 11, 18, 44, { front: ink(R.BLUE, 3), back: ink(R.BLUE, 7), left: ink(R.BLUE, 5), right: ink(R.BLUE, 6) });
  drawBox(b, alpha, 0, 0, 6, 8, 4, 17, { front: ink(R.BLUE, 2), back: ink(R.BLUE, 6), left: ink(R.BLUE, 4), right: ink(R.BLUE, 5) });
  if (c > 0.35) {
    // Les yeux et le voyant, sur la face avant.
    for (const y of [-4, 4]) b.rect(Math.round(middle - 6 * s + y * c - 1), 9, Math.round(middle - 6 * s + y * c), 11, () => ink(R.MINT, 0));
    const w = Math.max(1, Math.round(2 * c));
    b.rect(Math.round(middle - 7 * s - w / 2), 24, Math.round(middle - 7 * s + w / 2), 27, () => ink(R.PINK, 2));
  } else if (c < -0.35) {
    const w = Math.max(1, Math.round(3 * -c));
    b.rect(Math.round(middle + 7 * s - w), 22, Math.round(middle + 7 * s + w - 1), 36, () => ink(R.NIGHT, 6));
  }
  b.rect(15, 1, 16, 3, () => ink(R.GREY, 7));
  b.rect(15, 0, 16, 0, () => ink(R.PINK, 1));
  return b.toPatch(16, 56);
}

/** Le coffre caché derrière un mur : bois, ferrures et serrure, 80 unités de large. */
function chest(): Patch {
  const w = 80;
  const h = 52;
  const lid = 18;
  const b = new Bitmap(w, h);
  b.rect(4, 2, w - 5, 4, () => ink(R.GOLD, 7));
  b.rect(1, 5, w - 2, lid, (x, y) => ink(R.GOLD, (y < 8 ? 6 : 8) + (x % 16 === 0 ? 2 : 0)));
  b.rect(0, lid + 1, w - 1, lid + 3, () => ink(R.NIGHT, 6));
  b.rect(0, lid + 4, w - 1, h - 1, (x, y) => ink(R.GOLD, 9 + ((y - lid - 4) % 10 === 0 ? 2 : 0) + (x > w * 0.7 ? 1 : 0)));
  for (const x of [8, w - 13]) b.rect(x, 2, x + 4, h - 1, (_x, y) => ink(R.NIGHT, y % 7 === 0 ? 3 : 5));
  b.rect(w / 2 - 6, lid - 4, w / 2 + 5, lid + 12, () => ink(R.GREY, 4));
  b.rect(w / 2 - 1, lid + 1, w / 2, lid + 6, () => ink(R.NIGHT, 10));
  return b.toPatch(w / 2, h);
}

export function buildSprites(): Record<ThingKind, SpriteDef> {
  return {
    lampe: { frames: [[lamp()]], ticsPerFrame: 0, fullbright: true, radius: 10 },
    plante: { frames: [[plant()]], ticsPerFrame: 0, fullbright: false, radius: 14 },
    brasero: { frames: [0, 1, 2, 3].map((f) => [brazier(f)]), ticsPerFrame: 4, fullbright: true, radius: 16 },
    robot: { frames: [[0, 1, 2, 3, 4, 5, 6, 7].map(robot)], ticsPerFrame: 0, fullbright: false, radius: 18 },
    coffre: { frames: [[chest()]], ticsPerFrame: 0, fullbright: true, radius: 20 },
  };
}
