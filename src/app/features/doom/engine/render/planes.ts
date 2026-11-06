import { LightTables, MAX_LIGHT_Z, lightBand } from '../color/light-tables';
import { Graphics } from '../graphics/graphics.model';
import { FlatTexture } from '../level/level-data';
import { Sector } from '../level/level.model';
import { drawSkyColumn, drawSpan } from './draw';
import { Frame } from './frame';
import { CENTER_X, CENTER_Y, OWNER, OWNER_SHIFT, SCREEN_H, SCREEN_W } from './render.model';

/*
 * Les sols et les plafonds (r_plane). Pendant le dessin des murs, le trou laissé au-dessus et
 * au-dessous de chaque colonne est noté dans un « visplane » : une surface de même hauteur, même
 * texture et même lumière. Une fois les murs finis, chaque visplane est peint en lignes
 * horizontales : sur une ligne de l'écran, un sol plat est partout à la même distance.
 */

const UNUSED = 0xffff;

export interface Visplane {
  index: number;
  height: number;
  /** null : le ciel. */
  flat: FlatTexture | null;
  light: number;
  minX: number;
  maxX: number;
  /** Pour chaque colonne, la première et la dernière ligne du trou (UNUSED : colonne libre). */
  readonly top: Uint16Array;
  readonly bottom: Uint16Array;
  /** Les secteurs qui y ont contribué (pour la carte). */
  sectors: Sector[];
}

export class Planes {
  private readonly pool: Visplane[] = [];
  count = 0;
  private readonly spanStart = new Int16Array(SCREEN_H);
  // Le plan en cours de peinture.
  private height = 0;
  private lightRow = 0;
  private flat: Uint8Array = new Uint8Array(64 * 64);
  private owner = 0;

  constructor(
    private readonly f: Frame,
    private readonly graphics: Graphics,
    private readonly lights: LightTables,
  ) {}

  reset(): void {
    this.count = 0;
  }

  /** Le visplane de cette hauteur, cette texture et cette lumière (R_FindPlane). */
  find(height: number, flat: FlatTexture | null, light: number, sector: Sector): Visplane {
    // Tous les ciels n'en font qu'un.
    if (flat === null) {
      height = 0;
      light = 0;
    }
    for (let i = 0; i < this.count; i++) {
      const p = this.pool[i];
      if (p.height === height && p.flat === flat && p.light === light) {
        if (!p.sectors.includes(sector)) p.sectors.push(sector);
        return p;
      }
    }
    return this.create(height, flat, light, sector);
  }

  /** Les colonnes start à stop sont-elles libres dans ce plan ? Sinon, un plan identique tout neuf (R_CheckPlane). */
  check(p: Visplane, start: number, stop: number, sector: Sector): Visplane {
    const hi = Math.min(stop, p.maxX);
    let x = Math.max(start, p.minX);
    while (x <= hi && p.top[x] === UNUSED) x++;
    if (x > hi) {
      p.minX = Math.min(p.minX, start);
      p.maxX = Math.max(p.maxX, stop);
      if (!p.sectors.includes(sector)) p.sectors.push(sector);
      return p;
    }
    const fresh = this.create(p.height, p.flat, p.light, sector);
    fresh.minX = start;
    fresh.maxX = stop;
    return fresh;
  }

  /** Note le trou d'une colonne. */
  mark(p: Visplane, x: number, top: number, bottom: number): void {
    p.top[x] = top;
    p.bottom[x] = bottom;
  }

  /** Peint tous les visplanes, dans l'ordre où ils sont nés (R_DrawPlanes). */
  draw(): void {
    for (let i = 0; i < this.count; i++) {
      const p = this.pool[i];
      if (p.minX > p.maxX) continue;
      const op0 = this.f.ops;
      if (p.flat === null) this.drawSky(p);
      else {
        this.height = Math.abs(p.height - this.f.z);
        this.lightRow = lightBand(p.light) * MAX_LIGHT_Z;
        const frames = this.graphics.flats[p.flat];
        this.flat = frames[Math.floor(this.f.tic / 8) % frames.length];
        this.owner = (OWNER.PLANE << OWNER_SHIFT) | (i & 0xfff);
        // Les trous notés colonne par colonne deviennent des lignes horizontales.
        let pt = SCREEN_H;
        let pb = -1;
        for (let x = p.minX; x <= p.maxX + 1; x++) {
          let ct = SCREEN_H;
          let cb = -1;
          if (x <= p.maxX && p.top[x] !== UNUSED) {
            ct = p.top[x];
            cb = p.bottom[x];
          }
          this.makeSpans(x, pt, pb, ct, cb);
          pt = ct;
          pb = cb;
        }
      }
      this.f.trace?.planes.push({ sectors: p.sectors.slice(), sky: p.flat === null, op0, op1: this.f.ops });
    }
  }

  private create(height: number, flat: FlatTexture | null, light: number, sector: Sector): Visplane {
    let p = this.pool[this.count];
    if (!p) {
      p = { index: 0, height, flat, light, minX: 0, maxX: 0, top: new Uint16Array(SCREEN_W), bottom: new Uint16Array(SCREEN_W), sectors: [] };
      this.pool.push(p);
    }
    p.index = this.count++;
    p.height = height;
    p.flat = flat;
    p.light = light;
    p.minX = SCREEN_W;
    p.maxX = -1;
    p.top.fill(UNUSED);
    p.sectors = [sector];
    return p;
  }

  /** Passage de la colonne x - 1 (t1 à b1) à la colonne x (t2 à b2) : les lignes qui s'arrêtent sont peintes (R_MakeSpans). */
  private makeSpans(x: number, t1: number, b1: number, t2: number, b2: number): void {
    while (t1 < t2 && t1 <= b1) {
      this.mapPlane(t1, this.spanStart[t1], x - 1);
      t1++;
    }
    while (b1 > b2 && b1 >= t1) {
      this.mapPlane(b1, this.spanStart[b1], x - 1);
      b1--;
    }
    while (t2 < t1 && t2 <= b2) {
      this.spanStart[t2] = x;
      t2++;
    }
    while (b2 > b1 && b2 >= t2) {
      this.spanStart[b2] = x;
      b2--;
    }
  }

  /** Une ligne de sol : sa distance, sa lumière, et le point du niveau sous son premier pixel (R_MapPlane). */
  private mapPlane(y: number, x1: number, x2: number): void {
    const f = this.f;
    f.stats.spans++;
    if (!f.spend() || x2 < x1) return;
    const z = (this.height * f.focal) / Math.abs(y + 0.5 - CENTER_Y);
    const level = this.lights.z[this.lightRow + Math.min(MAX_LIGHT_Z - 1, Math.floor(z / 16))];
    const l = (CENTER_X - (x1 + 0.5)) / f.focal;
    const wx = f.x + z * (f.cos - l * f.sin);
    const wy = f.y + z * (f.sin + l * f.cos);
    drawSpan(f, y, x1, x2, this.flat, wx, wy, (z * f.sin) / f.focal, -(z * f.cos) / f.focal, level, this.owner);
  }

  /** Le ciel suit seulement la direction du regard : 1 024 colonnes de texture pour un tour complet. */
  private drawSky(p: Visplane): void {
    const f = this.f;
    const owner = (OWNER.SKY << OWNER_SHIFT) | (p.index & 0xfff);
    for (let x = p.minX; x <= p.maxX; x++) {
      const top = p.top[x];
      if (top === UNUSED || top > p.bottom[x]) continue;
      if (!f.spend()) continue;
      const column = Math.floor((-(f.angle + f.columnAngle[x]) * 1024) / (2 * Math.PI));
      drawSkyColumn(f, this.graphics.sky, x, top, p.bottom[x], column, owner);
    }
  }
}
