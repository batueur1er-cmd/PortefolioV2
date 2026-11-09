import { LightTables, MAX_LIGHT_SCALE, MAX_LIGHT_Z, lightBand } from '../color/light-tables';
import { Graphics, WallTex } from '../graphics/graphics.model';
import { pointSide, subsectorAt } from '../level/level';
import { BspChild, Level, Sector, Seg, Subsector, Thing } from '../level/level.model';
import { drawColumn, drawSkyColumn, drawSpan } from './draw';
import { Frame } from './frame';
import { sectorLight } from './lighting';
import { CENTER_X, CENTER_Y, OWNER, OWNER_SHIFT, SCREEN_H } from './render.model';
import { projectSeg } from './segs';
import { Things } from './things';

/*
 * Le comparateur : la même image, sans la ruse de Doom. Ici on applique l'algorithme du peintre :
 * tout est peint du plus loin au plus proche, en entier, et chaque surface recouvre ce qui est
 * derrière elle. Le résultat à l'écran est le même, mais des pixels sont écrits plusieurs fois.
 * L'ordre vient encore de l'arbre, parcouru à l'envers : c'est la liste des colonnes pleines
 * (les solidsegs) et les visplanes qui disparaissent.
 */
export class Painter {
  /** Les objets de chaque zone : un objet est peint juste après les murs de la sienne. */
  private readonly thingsIn = new Map<number, Thing[]>();

  constructor(
    private readonly level: Level,
    private readonly f: Frame,
    private readonly graphics: Graphics,
    private readonly lights: LightTables,
    private readonly things: Things,
  ) {
    for (const thing of level.things) {
      if (thing.hidden) continue;
      const ss = subsectorAt(level, thing.x, thing.y).index;
      const list = this.thingsIn.get(ss);
      if (list) list.push(thing);
      else this.thingsIn.set(ss, [thing]);
    }
  }

  walk(): void {
    this.node(this.level.root);
  }

  /** D'abord le côté opposé au joueur : le plus lointain sort en premier. */
  private node(child: BspChild): void {
    if (child.leaf) {
      this.subsector(child.leaf);
      return;
    }
    const node = child.node;
    this.f.stats.nodes++;
    const side = pointSide(node, this.f.x, this.f.y);
    this.node(node.children[side ^ 1]);
    this.node(node.children[side]);
  }

  private subsector(ss: Subsector): void {
    const f = this.f;
    f.stats.subsectors++;
    f.trace?.visits.push({ subsector: ss.index, op: f.ops });
    for (const seg of ss.segs) this.seg(seg);
    for (const thing of this.thingsIn.get(ss.index) ?? []) {
      if (this.things.paintWhole(thing)) f.stats.sprites++;
    }
  }

  /** Un seg en entier : le plafond et le sol qui vont jusqu'à lui, puis ses bandes de mur. */
  private seg(seg: Seg): void {
    const f = this.f;
    f.stats.segs++;
    const projected = projectSeg(f, seg);
    if (!projected) return;
    const { p, x1, x2 } = projected;
    const front = seg.front;
    const back = seg.back;
    const owner = (OWNER.WALL << OWNER_SHIFT) | (f.stats.walls & 0xfff);
    const opStart = f.ops;
    f.stats.walls++;
    const light = sectorLight(front, f.tic);
    const contrast = seg.v1.y === seg.v2.y ? -1 : seg.v1.x === seg.v2.x ? 1 : 0;
    const band = Math.max(0, Math.min(15, lightBand(light) + contrast)) * MAX_LIGHT_SCALE;
    let worldTop = front.ceiling - f.z;
    const worldBottom = front.floor - f.z;
    const worldHigh = back ? back.ceiling - f.z : 0;
    const worldLow = back ? back.floor - f.z : 0;
    if (back && front.sky && back.sky) worldTop = worldHigh;
    const span = p.sxB - p.sxA;

    for (let x = x1; x <= x2; x++) {
      if (!f.spend()) continue;
      const t = (x + 0.5 - p.sxA) / span;
      const iz = p.izA + (p.izB - p.izA) * t;
      const scale = f.focal * iz;
      const u = (p.uzA + (p.uzB - p.uzA) * t) / iz;
      const yTop = Math.ceil(CENTER_Y - worldTop * scale - 0.5);
      const yBottom = Math.ceil(CENTER_Y - worldBottom * scale - 0.5) - 1;
      const level = this.lights.scale[band + Math.min(MAX_LIGHT_SCALE - 1, Math.floor(scale * f.lightRatio * 16))];

      this.ceiling(front, light, x, Math.min(yTop - 1, SCREEN_H - 1));
      this.floor(front, light, x, Math.max(yBottom + 1, 0));

      if (!back) {
        this.band(x, yTop, yBottom, this.graphics.walls[seg.sidedef.mid ?? front.wall], u, worldTop, scale, level, owner);
        continue;
      }
      if (worldHigh < worldTop) {
        const tex = this.graphics.walls[seg.sidedef.upper ?? front.wall];
        this.band(x, yTop, Math.ceil(CENTER_Y - worldHigh * scale - 0.5) - 1, tex, u, worldHigh + tex.height, scale, level, owner);
      }
      if (worldLow > worldBottom) {
        const tex = this.graphics.walls[seg.sidedef.lower ?? front.wall];
        this.band(x, Math.ceil(CENTER_Y - worldLow * scale - 0.5), yBottom, tex, u, worldLow, scale, level, owner);
      }
    }
    f.trace?.walls.push({ seg, x1, x2, op: opStart });
  }

  private band(x: number, y1: number, y2: number, tex: WallTex, u: number, anchor: number, scale: number, level: number, owner: number): void {
    drawColumn(this.f, x, Math.max(0, y1), Math.min(SCREEN_H - 1, y2), tex, u, anchor, scale, level, owner);
  }

  private ceiling(sector: Sector, light: number, x: number, bottom: number): void {
    const f = this.f;
    if (bottom < 0) return;
    if (sector.sky) {
      const column = Math.floor((-(f.angle + f.columnAngle[x]) * 1024) / (2 * Math.PI));
      drawSkyColumn(f, this.graphics.sky, x, 0, bottom, column, OWNER.SKY << OWNER_SHIFT);
    } else if (sector.ceiling > f.z && sector.ceilingFlat) {
      this.flat(sector.ceiling, sector.ceilingFlat, light, x, 0, bottom, 1);
    }
  }

  private floor(sector: Sector, light: number, x: number, top: number): void {
    if (top < SCREEN_H && sector.floor < this.f.z) this.flat(sector.floor, sector.floorFlat, light, x, top, SCREEN_H - 1, 0);
  }

  /** Une colonne de sol ou de plafond, pixel par pixel : chaque ligne de l'écran a sa propre distance. */
  private flat(height: number, name: Sector['floorFlat'], light: number, x: number, y1: number, y2: number, id: number): void {
    const f = this.f;
    const frames = this.graphics.flats[name];
    const flat = frames[Math.floor(f.tic / 8) % frames.length];
    const row = lightBand(light) * MAX_LIGHT_Z;
    const dy = Math.abs(height - f.z);
    const owner = (OWNER.PLANE << OWNER_SHIFT) | id;
    const l = (CENTER_X - (x + 0.5)) / f.focal;
    for (let y = y1; y <= y2; y++) {
      const z = (dy * f.focal) / Math.abs(y + 0.5 - CENTER_Y);
      const level = this.lights.z[row + Math.min(MAX_LIGHT_Z - 1, Math.floor(z / 16))];
      drawSpan(f, y, x, x, flat, f.x + z * (f.cos - l * f.sin), f.y + z * (f.sin + l * f.cos), 0, 0, level, owner);
    }
  }
}
