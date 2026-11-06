import { LIGHT_LEVELS, LightTables, MAX_LIGHT_SCALE, lightBand } from '../color/light-tables';
import { Graphics, WallTex } from '../graphics/graphics.model';
import { Sector, Seg } from '../level/level.model';
import { drawColumn } from './draw';
import { Frame } from './frame';
import { sectorLight } from './lighting';
import { Planes, Visplane } from './planes';
import { CENTER_Y, OWNER, OWNER_SHIFT, SCREEN_H, SCREEN_W } from './render.model';

/*
 * Les murs (r_segs). Un mur reste vertical à l'écran : sur une colonne, il est partout à la même
 * distance. Il est donc peint en bandes d'un pixel de large, et l'échelle n'est calculée qu'aux
 * deux bouts : entre les deux, elle évolue d'une colonne à l'autre par simple addition.
 */

export const SIL_BOTTOM = 1;
export const SIL_TOP = 2;

/** Un seg projeté sur l'écran par le parcours de l'arbre : abscisses, 1/distance et texture aux deux bouts. */
export interface ProjectedSeg {
  readonly seg: Seg;
  readonly sxA: number;
  readonly sxB: number;
  readonly izA: number;
  readonly izB: number;
  /** Abscisse dans la texture, divisée par la distance (elle varie ainsi linéairement à l'écran). */
  readonly uzA: number;
  readonly uzB: number;
}

/** Une plage de mur dessinée, gardée pour découper les sprites (un « drawseg »). */
export interface DrawSeg {
  index: number;
  seg: Seg;
  x1: number;
  x2: number;
  scale1: number;
  scale2: number;
  silhouette: number;
  /** Un sprite posé plus haut (ou plus bas) que ces hauteurs n'est pas caché par le bas (ou le haut). */
  bottomHeight: number;
  topHeight: number;
  /** Début de ses bornes dans `openings` : d'abord le haut, puis le bas, colonne par colonne. */
  clip: number;
}

export class Segs {
  readonly drawsegs: DrawSeg[] = [];
  count = 0;
  /** Les bornes de chaque colonne de chaque drawseg, à la suite (les « openings »). */
  openings = new Int16Array(SCREEN_W * 64);
  private openingCount = 0;
  /** Le sol et le plafond de la zone en cours, posés par le parcours de l'arbre. */
  floorPlane: Visplane | null = null;
  ceilingPlane: Visplane | null = null;
  sector: Sector | null = null;

  constructor(
    private readonly f: Frame,
    private readonly planes: Planes,
    private readonly graphics: Graphics,
    private readonly lights: LightTables,
  ) {}

  reset(): void {
    this.count = 0;
    this.openingCount = 0;
  }

  /** Borne haute (ou basse) laissée par un drawseg à une colonne. */
  clipTop(ds: DrawSeg, x: number): number {
    return this.openings[ds.clip + (x - ds.x1)];
  }

  clipBottom(ds: DrawSeg, x: number): number {
    return this.openings[ds.clip + (ds.x2 - ds.x1 + 1) + (x - ds.x1)];
  }

  /** Dessine un seg sur les colonnes start à stop, et note ce qu'il laisse voir (R_StoreWallRange). */
  store(p: ProjectedSeg, start: number, stop: number): void {
    if (start > stop) return;
    const f = this.f;
    const { seg } = p;
    const front = seg.front;
    const back = seg.back;
    const side = seg.sidedef;
    const ds = this.newDrawSeg(seg, start, stop);
    const opStart = f.ops;
    f.stats.walls++;

    let worldTop = front.ceiling - f.z;
    const worldBottom = front.floor - f.z;
    let worldHigh = 0;
    let worldLow = 0;
    let mid: WallTex | null = null;
    let top: WallTex | null = null;
    let bottom: WallTex | null = null;
    // Hauteur (par rapport aux yeux) de la ligne 0 de chaque texture.
    let midAnchor = 0;
    let topAnchor = 0;
    let bottomAnchor = 0;
    let markFloor = true;
    let markCeiling = true;
    const light = sectorLight(front, f.tic);

    if (!back) {
      // Mur plein : la texture part du plafond, et il cache tout ce qui est derrière lui.
      mid = this.graphics.walls[side.mid ?? front.wall];
      midAnchor = worldTop;
      ds.silhouette = SIL_BOTTOM | SIL_TOP;
    } else {
      worldHigh = back.ceiling - f.z;
      worldLow = back.floor - f.z;
      // Deux ciels qui se touchent : pas de mur entre eux.
      if (front.sky && back.sky) worldTop = worldHigh;
      if (front.floor > back.floor) {
        ds.silhouette |= SIL_BOTTOM;
        ds.bottomHeight = front.floor;
      } else if (back.floor > f.z) {
        ds.silhouette |= SIL_BOTTOM;
      }
      if (front.ceiling < back.ceiling) {
        ds.silhouette |= SIL_TOP;
        ds.topHeight = front.ceiling;
      } else if (back.ceiling < f.z) {
        ds.silhouette |= SIL_TOP;
      }
      const backLight = sectorLight(back, f.tic);
      markFloor = worldLow !== worldBottom || back.floorFlat !== front.floorFlat || backLight !== light;
      markCeiling = worldHigh !== worldTop || back.ceilingFlat !== front.ceilingFlat || backLight !== light;
      if (back.ceiling <= front.floor || back.floor >= front.ceiling) {
        // Une porte fermée.
        markFloor = true;
        markCeiling = true;
      }
      if (worldHigh < worldTop) {
        top = this.graphics.walls[side.upper ?? front.wall];
        // Le bas de la texture se cale sur le plafond d'en face.
        topAnchor = worldHigh + top.height;
      }
      if (worldLow > worldBottom) {
        bottom = this.graphics.walls[side.lower ?? front.wall];
        bottomAnchor = worldLow;
      }
    }
    // Un sol ne se voit que d'en haut, un plafond que d'en bas.
    if (front.floor >= f.z) markFloor = false;
    if (front.ceiling <= f.z && !front.sky) markCeiling = false;
    const sector = this.sector ?? front;
    const ceilingPlane = markCeiling && this.ceilingPlane ? (this.ceilingPlane = this.planes.check(this.ceilingPlane, start, stop, sector)) : null;
    const floorPlane = markFloor && this.floorPlane ? (this.floorPlane = this.planes.check(this.floorPlane, start, stop, sector)) : null;

    // Faux contraste : un mur est-ouest un cran plus sombre, un mur nord-sud un cran plus clair.
    const contrast = seg.v1.y === seg.v2.y ? -1 : seg.v1.x === seg.v2.x ? 1 : 0;
    const lights = Math.max(0, Math.min(LIGHT_LEVELS - 1, lightBand(light) + contrast)) * MAX_LIGHT_SCALE;
    const owner = (OWNER.WALL << OWNER_SHIFT) | (ds.index & 0xfff);
    const count = stop - start + 1;
    const span = p.sxB - p.sxA;
    const at = (x: number) => p.izA + (p.izB - p.izA) * ((x + 0.5 - p.sxA) / span);

    for (let x = start; x <= stop; x++) {
      // Sur une colonne, une seule échelle : le mur y est partout à la même distance.
      const t = (x + 0.5 - p.sxA) / span;
      const iz = p.izA + (p.izB - p.izA) * t;
      const scale = f.focal * iz;
      const u = (p.uzA + (p.uzB - p.uzA) * t) / iz;
      let yl = Math.ceil(CENTER_Y - worldTop * scale - 0.5);
      let yh = Math.ceil(CENTER_Y - worldBottom * scale - 0.5) - 1;
      const topClip = f.ceilingClip[x] + 1;
      const bottomClip = f.floorClip[x] - 1;
      if (yl < topClip) yl = topClip;
      if (ceilingPlane) {
        const cb = Math.min(yl - 1, bottomClip);
        if (topClip <= cb) this.planes.mark(ceilingPlane, x, topClip, cb);
      }
      if (yh > bottomClip) yh = bottomClip;
      if (floorPlane) {
        const ft = Math.max(yh + 1, topClip);
        if (ft <= bottomClip) this.planes.mark(floorPlane, x, ft, bottomClip);
      }
      const level = this.lights.scale[lights + Math.min(MAX_LIGHT_SCALE - 1, Math.floor(scale * f.lightRatio * 16))];
      const draw = f.spend();
      if (mid) {
        if (draw) drawColumn(f, x, yl, yh, mid, u, midAnchor, scale, level, owner);
        f.ceilingClip[x] = SCREEN_H;
        f.floorClip[x] = -1;
      } else {
        if (top) {
          let m = Math.ceil(CENTER_Y - worldHigh * scale - 0.5) - 1;
          if (m >= f.floorClip[x]) m = f.floorClip[x] - 1;
          if (m >= yl) {
            if (draw) drawColumn(f, x, yl, m, top, u, topAnchor, scale, level, owner);
            f.ceilingClip[x] = m;
          } else f.ceilingClip[x] = yl - 1;
        } else if (markCeiling) f.ceilingClip[x] = yl - 1;
        if (bottom) {
          let m = Math.ceil(CENTER_Y - worldLow * scale - 0.5);
          if (m <= f.ceilingClip[x]) m = f.ceilingClip[x] + 1;
          if (m <= yh) {
            if (draw) drawColumn(f, x, m, yh, bottom, u, bottomAnchor, scale, level, owner);
            f.floorClip[x] = m;
          } else f.floorClip[x] = yh + 1;
        } else if (markFloor) f.floorClip[x] = yh + 1;
      }
      this.openings[ds.clip + (x - start)] = f.ceilingClip[x];
      this.openings[ds.clip + count + (x - start)] = f.floorClip[x];
    }
    ds.scale1 = f.focal * at(start);
    ds.scale2 = f.focal * at(stop);
    f.trace?.walls.push({ seg, x1: start, x2: stop, op: opStart });
  }

  private newDrawSeg(seg: Seg, x1: number, x2: number): DrawSeg {
    const count = x2 - x1 + 1;
    if (this.openingCount + count * 2 > this.openings.length) {
      const grown = new Int16Array(this.openings.length * 2 + count * 2);
      grown.set(this.openings);
      this.openings = grown;
    }
    let ds = this.drawsegs[this.count];
    if (!ds) {
      ds = { index: 0, seg, x1, x2, scale1: 0, scale2: 0, silhouette: 0, bottomHeight: Infinity, topHeight: -Infinity, clip: 0 };
      this.drawsegs.push(ds);
    }
    ds.index = this.count++;
    ds.seg = seg;
    ds.x1 = x1;
    ds.x2 = x2;
    ds.silhouette = 0;
    ds.bottomHeight = Infinity;
    ds.topHeight = -Infinity;
    ds.clip = this.openingCount;
    this.openingCount += count * 2;
    return ds;
  }
}
