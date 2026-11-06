import { LightTables, MAX_LIGHT_SCALE, lightBand } from '../color/light-tables';
import { Graphics, Patch } from '../graphics/graphics.model';
import { sideOf } from '../level/geometry';
import { Sector, Thing } from '../level/level.model';
import { drawPosts } from './draw';
import { Frame } from './frame';
import { sectorLight } from './lighting';
import { CENTER_X, CENTER_Y, FOCAL, OWNER, OWNER_SHIFT, SCREEN_H, SCREEN_W } from './render.model';
import { SIL_BOTTOM, SIL_TOP, Segs } from './segs';

/*
 * Les objets (r_things). Ce sont des images plates tournées vers le joueur. Pendant le parcours
 * de l'arbre, chaque objet devant le joueur est projeté (un « vissprite ») ; une fois le décor
 * fini, ils sont triés du plus loin au plus proche et peints par-dessus, découpés par les murs
 * dessinés devant eux.
 */

const NO_CLIP = -2;

interface VisSprite {
  thing: Thing;
  patch: Patch;
  /** Abscisse (écran) du bord gauche de l'image. */
  left: number;
  scale: number;
  x1: number;
  x2: number;
  /** Hauteurs du pied et du sommet de l'image. */
  gz: number;
  gzt: number;
  level: number;
}

export class Things {
  private readonly sprites: VisSprite[] = [];
  private readonly stamp: Uint32Array;
  private frameId = 0;
  private readonly clipTop = new Int16Array(SCREEN_W);
  private readonly clipBottom = new Int16Array(SCREEN_W);

  constructor(
    private readonly f: Frame,
    private readonly segs: Segs,
    private readonly graphics: Graphics,
    private readonly lights: LightTables,
    sectorCount: number,
  ) {
    this.stamp = new Uint32Array(sectorCount);
  }

  reset(): void {
    this.sprites.length = 0;
    this.frameId = (this.frameId + 1) >>> 0;
  }

  /** Les objets d'un secteur, projetés une seule fois par image (R_AddSprites). */
  add(sector: Sector): void {
    if (this.stamp[sector.index] === this.frameId) return;
    this.stamp[sector.index] = this.frameId;
    for (const thing of sector.things) this.project(thing);
  }

  /** Du plus loin au plus proche : chaque objet est peint par-dessus ce qui est derrière lui (R_DrawMasked). */
  draw(): void {
    const order = this.sprites.slice().sort((a, b) => a.scale - b.scale);
    order.forEach((vis, n) => {
      const op0 = this.f.ops;
      this.drawSprite(vis, n);
      this.f.stats.sprites++;
      this.f.trace?.sprites.push({ thing: vis.thing, op0, op1: this.f.ops });
    });
  }

  /**
   * Les objets cachés dans l'épaisseur des murs, peints par-dessus toute l'image et sans découpe :
   * c'est ce que révèlent les rayons X. Ils ne comptent pas dans les opérations du rendu.
   */
  drawHidden(things: readonly Thing[]): void {
    const order = things
      .map((thing) => this.projectThing(thing))
      .filter((vis): vis is VisSprite => vis !== null)
      .sort((a, b) => a.scale - b.scale);
    order.forEach((vis, n) => {
      const owner = (OWNER.HIDDEN << OWNER_SHIFT) | (n & 0xfff);
      const top = CENTER_Y - (vis.gzt - this.f.z) * vis.scale;
      for (let x = vis.x1; x <= vis.x2; x++) {
        const col = Math.floor((x + 0.5 - vis.left) / vis.scale);
        if (col >= 0 && col < vis.patch.width) drawPosts(this.f, x, vis.patch.columns[col], top, vis.scale, -1, SCREEN_H, 0, owner);
      }
    });
  }

  private project(thing: Thing): void {
    const vis = this.projectThing(thing);
    if (vis) this.sprites.push(vis);
  }

  /** R_ProjectSprite : sa place à l'écran, son image (selon l'angle de vue) et sa lumière. */
  private projectThing(thing: Thing): VisSprite | null {
    const f = this.f;
    const dx = thing.x - f.x;
    const dy = thing.y - f.y;
    const tz = dx * f.cos + dy * f.sin;
    if (tz < 4) return null;
    const tl = dy * f.cos - dx * f.sin;
    if (Math.abs(tl) > tz * 4) return null;
    const def = this.graphics.sprites[thing.kind];
    const frame = def.frames[def.ticsPerFrame ? Math.floor(f.tic / def.ticsPerFrame) % def.frames.length : 0];
    let patch = frame[0];
    if (frame.length === 8) {
      // L'image qui correspond à l'angle sous lequel on voit l'objet.
      const rel = Math.atan2(f.y - thing.y, f.x - thing.x) - thing.angle;
      patch = frame[((Math.round(rel / (Math.PI / 4)) % 8) + 8) % 8];
    }
    const scale = FOCAL / tz;
    const left = CENTER_X - tl * scale - patch.leftOffset * scale;
    const x1 = Math.ceil(left - 0.5);
    const x2 = Math.ceil(left + patch.width * scale - 0.5) - 1;
    if (x1 > SCREEN_W - 1 || x2 < 0 || x1 > x2) return null;
    const lights = lightBand(sectorLight(thing.sector, f.tic)) * MAX_LIGHT_SCALE;
    return {
      thing,
      patch,
      left,
      scale,
      x1: Math.max(0, x1),
      x2: Math.min(SCREEN_W - 1, x2),
      gz: thing.z,
      gzt: thing.z + patch.topOffset,
      level: def.fullbright ? 0 : this.lights.scale[lights + Math.min(MAX_LIGHT_SCALE - 1, Math.floor(scale * 16))],
    };
  }

  /** R_DrawSprite : la découpe par les murs qui passent devant, puis les colonnes de l'image. */
  private drawSprite(vis: VisSprite, n: number): void {
    const { clipTop, clipBottom, segs } = this;
    clipTop.fill(NO_CLIP, vis.x1, vis.x2 + 1);
    clipBottom.fill(NO_CLIP, vis.x1, vis.x2 + 1);
    // Les murs dessinés, du plus lointain au plus proche : le premier qui passe devant donne la découpe.
    for (let i = segs.count - 1; i >= 0; i--) {
      const ds = segs.drawsegs[i];
      if (ds.x1 > vis.x2 || ds.x2 < vis.x1 || !ds.silhouette) continue;
      const lo = Math.min(ds.scale1, ds.scale2);
      const hi = Math.max(ds.scale1, ds.scale2);
      const seg = ds.seg;
      const objectInFront = sideOf(vis.thing.x, vis.thing.y, seg.v1.x, seg.v1.y, seg.v2.x - seg.v1.x, seg.v2.y - seg.v1.y) > 0;
      if (hi < vis.scale || (lo < vis.scale && objectInFront)) continue;
      let sil = ds.silhouette;
      if (vis.gz >= ds.bottomHeight) sil &= ~SIL_BOTTOM;
      if (vis.gzt <= ds.topHeight) sil &= ~SIL_TOP;
      if (!sil) continue;
      for (let x = Math.max(ds.x1, vis.x1); x <= Math.min(ds.x2, vis.x2); x++) {
        if (sil & SIL_BOTTOM && clipBottom[x] === NO_CLIP) clipBottom[x] = segs.clipBottom(ds, x);
        if (sil & SIL_TOP && clipTop[x] === NO_CLIP) clipTop[x] = segs.clipTop(ds, x);
      }
    }
    const { patch, scale } = vis;
    const owner = (OWNER.SPRITE << OWNER_SHIFT) | (n & 0xfff);
    const top = CENTER_Y - (vis.gzt - this.f.z) * scale;
    for (let x = vis.x1; x <= vis.x2; x++) {
      if (!this.f.spend()) continue;
      const col = Math.floor((x + 0.5 - vis.left) / scale);
      if (col < 0 || col >= patch.width) continue;
      const ct = clipTop[x] === NO_CLIP ? -1 : clipTop[x];
      const cb = clipBottom[x] === NO_CLIP ? SCREEN_H : clipBottom[x];
      drawPosts(this.f, x, patch.columns[col], top, scale, ct, cb, vis.level, owner);
    }
  }
}
