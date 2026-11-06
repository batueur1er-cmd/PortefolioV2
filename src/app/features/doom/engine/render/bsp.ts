import { pointSide } from '../level/level';
import { BspChild, Box, Level, Seg, Subsector } from '../level/level.model';
import { Frame } from './frame';
import { sectorLight } from './lighting';
import { Planes } from './planes';
import { CENTER_X, NEAR, SCREEN_W } from './render.model';
import { ProjectedSeg, Segs } from './segs';
import { Things } from './things';

/*
 * Le parcours de l'arbre (r_bsp). Du nœud racine, on descend d'abord du côté où se tient le
 * joueur : les zones sortent ainsi de la plus proche à la plus lointaine. Chaque seg visible est
 * projeté sur des colonnes de l'écran ; une liste des plages de colonnes déjà couvertes par des
 * murs pleins (les « solidsegs ») évite de repeindre, et permet d'écarter d'un coup un sous-arbre
 * entier dont la boîte englobante tombe sur des colonnes pleines.
 */

/** Une plage de colonnes déjà couverte par des murs pleins. */
interface Range {
  first: number;
  last: number;
}

const wrap = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

export class Bsp {
  private ranges: Range[] = [];

  constructor(
    private readonly level: Level,
    private readonly f: Frame,
    private readonly planes: Planes,
    private readonly segs: Segs,
    private readonly things: Things,
  ) {}

  reset(): void {
    // Deux plages sentinelles, de part et d'autre de l'écran.
    this.ranges = [
      { first: -0x7fff, last: -1 },
      { first: SCREEN_W, last: 0x7fff },
    ];
  }

  /** Parcourt l'arbre depuis la racine (R_RenderBSPNode). */
  walk(): void {
    this.node(this.level.root);
  }

  private node(child: BspChild): void {
    if (child.leaf) {
      this.subsector(child.leaf);
      return;
    }
    const node = child.node;
    this.f.stats.nodes++;
    // D'abord le côté du joueur (R_PointOnSide), puis l'autre s'il peut encore se voir (R_CheckBBox).
    const side = pointSide(node, this.f.x, this.f.y);
    this.node(node.children[side]);
    if (this.boxVisible(node.boxes[side ^ 1])) this.node(node.children[side ^ 1]);
    else this.f.stats.culled++;
  }

  /** La boîte peut-elle encore apparaître : dans le champ de vision, sur des colonnes pas encore pleines ? */
  private boxVisible(box: Box): boolean {
    const { x: vx, y: vy } = this.f;
    if (vx >= box.minX && vx <= box.maxX && vy >= box.minY && vy <= box.maxY) return true;
    const ref = Math.atan2((box.minY + box.maxY) / 2 - vy, (box.minX + box.maxX) / 2 - vx);
    let lo = Infinity;
    let hi = -Infinity;
    for (let corner = 0; corner < 4; corner++) {
      const x = corner & 1 ? box.maxX : box.minX;
      const y = corner & 2 ? box.maxY : box.minY;
      const rel = wrap(Math.atan2(y - vy, x - vx) - ref);
      lo = Math.min(lo, rel);
      hi = Math.max(hi, rel);
    }
    const base = wrap(ref - this.f.angle);
    let left = base + hi;
    let right = base + lo;
    const half = this.f.fovHalf;
    if (right > half || left < -half) return false;
    left = Math.min(left, half);
    right = Math.max(right, -half);
    const x1 = Math.max(0, Math.floor(CENTER_X - Math.tan(left) * this.f.focal));
    const x2 = Math.min(SCREEN_W - 1, Math.ceil(CENTER_X - Math.tan(right) * this.f.focal));
    let i = 0;
    while (this.ranges[i].last < x1) i++;
    return !(x1 >= this.ranges[i].first && x2 <= this.ranges[i].last);
  }

  /** Une zone : son sol, son plafond, ses objets, puis ses segs (R_Subsector). */
  private subsector(ss: Subsector): void {
    const f = this.f;
    const sector = ss.sector;
    f.stats.subsectors++;
    f.trace?.visits.push({ subsector: ss.index, op: f.ops });
    const light = sectorLight(sector, f.tic);
    this.segs.sector = sector;
    this.segs.floorPlane = sector.floor < f.z ? this.planes.find(sector.floor, sector.floorFlat, light, sector) : null;
    this.segs.ceilingPlane =
      sector.ceiling > f.z || sector.sky ? this.planes.find(sector.ceiling, sector.sky ? null : sector.ceilingFlat, light, sector) : null;
    this.things.add(sector);
    for (const seg of ss.segs) this.addLine(seg);
  }

  /** Projette un seg sur l'écran, puis l'envoie à la bonne liste de colonnes (R_AddLine). */
  private addLine(seg: Seg): void {
    const f = this.f;
    f.stats.segs++;
    const ax = seg.v1.x - f.x;
    const ay = seg.v1.y - f.y;
    const bx = seg.v2.x - f.x;
    const by = seg.v2.y - f.y;
    // Vu de dos (le joueur est à sa gauche) : rien à dessiner.
    if (ay * (seg.v2.x - seg.v1.x) - ax * (seg.v2.y - seg.v1.y) <= 0) return;
    // Dans le repère du regard : z vers l'avant, l vers la gauche.
    let za = ax * f.cos + ay * f.sin;
    let la = ay * f.cos - ax * f.sin;
    let zb = bx * f.cos + by * f.sin;
    let lb = by * f.cos - bx * f.sin;
    let ua = seg.offset;
    let ub = seg.offset + seg.length;
    // Rogne le seg aux bords du champ de vision (l ≤ z·t et -l ≤ z·t ; t = 1 à 90°), puis devant les yeux.
    const t0 = f.tanHalf;
    for (let edge = 0; edge < 3; edge++) {
      const fa = edge === 0 ? za * t0 - la : edge === 1 ? za * t0 + la : za - NEAR;
      const fb = edge === 0 ? zb * t0 - lb : edge === 1 ? zb * t0 + lb : zb - NEAR;
      if (fa < 0 && fb < 0) return;
      if (fa < 0 || fb < 0) {
        const t = fa / (fa - fb);
        const z = za + (zb - za) * t;
        const l = la + (lb - la) * t;
        const u = ua + (ub - ua) * t;
        if (fa < 0) {
          za = z;
          la = l;
          ua = u;
        } else {
          zb = z;
          lb = l;
          ub = u;
        }
      }
    }
    const sxA = CENTER_X - (la / za) * f.focal;
    const sxB = CENTER_X - (lb / zb) * f.focal;
    if (sxB - sxA < 1e-6) return;
    // Les colonnes dont le centre tombe entre les deux bouts.
    const x1 = Math.max(0, Math.ceil(sxA - 0.5));
    const x2 = Math.min(SCREEN_W - 1, Math.ceil(sxB - 0.5) - 1);
    if (x1 > x2) return;
    const p: ProjectedSeg = { seg, sxA, sxB, izA: 1 / za, izB: 1 / zb, uzA: ua / za, uzB: ub / zb };

    const front = seg.front;
    const back = seg.back;
    // Mur plein, ou porte fermée : les colonnes deviennent pleines.
    if (!back || back.ceiling <= front.floor || back.floor >= front.ceiling) {
      this.clipSolid(p, x1, x2);
      return;
    }
    // Une ouverture avec une marche ou un linteau : on dessine, mais on voit à travers.
    if (back.ceiling !== front.ceiling || back.floor !== front.floor) {
      this.clipPass(p, x1, x2);
      return;
    }
    // Même hauteur, même sol, même lumière des deux côtés : une ligne invisible.
    if (back.ceilingFlat === front.ceilingFlat && back.floorFlat === front.floorFlat && sectorLight(back, f.tic) === sectorLight(front, f.tic)) {
      return;
    }
    this.clipPass(p, x1, x2);
  }

  /** Mur plein : dessine les morceaux pas encore couverts, puis les ajoute aux plages pleines (R_ClipSolidWallSegment). */
  private clipSolid(p: ProjectedSeg, first: number, last: number): void {
    const r = this.ranges;
    let i = 0;
    while (r[i].last < first - 1) i++;
    if (first < r[i].first) {
      if (last < r[i].first - 1) {
        // Entièrement visible : une nouvelle plage.
        this.segs.store(p, first, last);
        r.splice(i, 0, { first, last });
        return;
      }
      this.segs.store(p, first, r[i].first - 1);
      r[i].first = first;
    }
    if (last <= r[i].last) return;
    let j = i;
    while (last >= r[j + 1].first - 1) {
      // Le trou entre deux plages est comblé.
      this.segs.store(p, r[j].last + 1, r[j + 1].first - 1);
      j++;
      if (last <= r[j].last) {
        r[i].last = r[j].last;
        r.splice(i + 1, j - i);
        return;
      }
    }
    this.segs.store(p, r[j].last + 1, last);
    r[i].last = last;
    r.splice(i + 1, j - i);
  }

  /** Ouverture : dessine les morceaux visibles, sans fermer les colonnes (R_ClipPassWallSegment). */
  private clipPass(p: ProjectedSeg, first: number, last: number): void {
    const r = this.ranges;
    let i = 0;
    while (r[i].last < first - 1) i++;
    if (first < r[i].first) {
      if (last < r[i].first - 1) {
        this.segs.store(p, first, last);
        return;
      }
      this.segs.store(p, first, r[i].first - 1);
    }
    if (last <= r[i].last) return;
    while (last >= r[i + 1].first - 1) {
      this.segs.store(p, r[i].last + 1, r[i + 1].first - 1);
      i++;
      if (last <= r[i].last) return;
    }
    this.segs.store(p, r[i].last + 1, last);
  }
}
