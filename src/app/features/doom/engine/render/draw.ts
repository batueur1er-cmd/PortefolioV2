import { Post, WallTex } from '../graphics/graphics.model';
import { Frame } from './frame';
import { CENTER_Y, SCREEN_H, SCREEN_W } from './render.model';

/*
 * Les pinceaux du moteur : tout ce qui écrit des pixels. Chacun ne fait qu'une boucle simple, un
 * pixel après l'autre, avec une addition par pas : c'est ce qui rendait Doom rapide.
 */

/**
 * Une bande verticale de mur (R_DrawColumn). `anchor` est la hauteur de la ligne 0 de la texture
 * au-dessus des yeux ; sur une colonne, la texture avance de 1/échelle par pixel.
 */
export function drawColumn(f: Frame, x: number, y1: number, y2: number, tex: WallTex, u: number, anchor: number, scale: number, level: number, owner: number): void {
  if (y1 > y2) return;
  const inv = 1 / scale;
  const base = (Math.floor(u) & (tex.width - 1)) * tex.height;
  const mask = tex.height - 1;
  const cmap = level * 256;
  let v = anchor + (y1 + 0.5 - CENTER_Y) * inv;
  let i = y1 * SCREEN_W + x;
  for (let y = y1; y <= y2; y++, i += SCREEN_W) {
    f.pixels[i] = f.colormaps[cmap + tex.data[base + (Math.floor(v) & mask)]];
    f.owner[i] = owner;
    f.count(i);
    v += inv;
  }
}

/** Une ligne de sol ou de plafond (R_DrawSpan) : la texture de 64 × 64 suivie pas à pas. */
export function drawSpan(f: Frame, y: number, x1: number, x2: number, flat: Uint8Array, wx: number, wy: number, stepX: number, stepY: number, level: number, owner: number): void {
  const cmap = level * 256;
  let i = y * SCREEN_W + x1;
  for (let x = x1; x <= x2; x++, i++) {
    f.pixels[i] = f.colormaps[cmap + flat[((63 - (Math.floor(wy) & 63)) << 6) | (Math.floor(wx) & 63)]];
    f.owner[i] = owner;
    f.count(i);
    wx += stepX;
    wy += stepY;
  }
}

/** Une colonne de ciel : une colonne de sa texture, ligne pour ligne, en pleine lumière. */
export function drawSkyColumn(f: Frame, sky: WallTex, x: number, y1: number, y2: number, column: number, owner: number): void {
  const base = (column & (sky.width - 1)) * sky.height;
  let i = y1 * SCREEN_W + x;
  for (let y = y1; y <= y2; y++, i += SCREEN_W) {
    f.pixels[i] = sky.data[base + Math.min(sky.height - 1, y)];
    f.owner[i] = owner;
    f.count(i);
  }
}

/**
 * Les morceaux opaques d'une colonne de sprite (R_DrawMaskedColumn), mis à l'échelle et bornés
 * par ce que les murs laissent voir (`clipTop` et `clipBottom` exclus).
 */
export function drawPosts(f: Frame, x: number, posts: readonly Post[], top: number, scale: number, clipTop: number, clipBottom: number, level: number, owner: number): void {
  const inv = 1 / scale;
  const cmap = level * 256;
  for (const post of posts) {
    const yA = top + post.top * scale;
    const yB = yA + post.pixels.length * scale;
    const y1 = Math.max(0, Math.ceil(yA - 0.5), clipTop + 1);
    const y2 = Math.min(SCREEN_H - 1, Math.ceil(yB - 0.5) - 1, clipBottom - 1);
    let i = y1 * SCREEN_W + x;
    for (let y = y1; y <= y2; y++, i += SCREEN_W) {
      const row = Math.min(post.pixels.length - 1, Math.max(0, Math.floor((y + 0.5 - yA) * inv)));
      f.pixels[i] = f.colormaps[cmap + post.pixels[row]];
      f.owner[i] = owner;
      f.count(i);
    }
  }
}
