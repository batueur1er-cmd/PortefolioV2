import { EPS, Vertices, boxOf, chordOf, clipConvex, sideOf } from './geometry';
import { BspChild, BspNode, Seg, Subsector, Vertex } from './level.model';

/*
 * Le « node builder » : l'outil qui tournait une fois, à la fabrication du niveau, pour découper la
 * carte en zones convexes rangées dans un arbre BSP (binary space partitioning). À chaque nœud, une
 * droite tirée d'un seg partage les autres segs entre l'avant et l'arrière, quitte à en couper.
 */

const FRONT = 0;
const BACK = 1;
const SPLIT = 2;

/** Ce que le node builder range au fur et à mesure. */
interface Collected {
  readonly nodes: BspNode[];
  readonly subsectors: Subsector[];
  /** Les segs, rangés zone par zone (comme le lump SEGS). */
  readonly segs: Seg[];
}

export interface Tree extends Collected {
  readonly root: BspChild;
}

/** Où se trouve un seg par rapport à la droite d'un autre seg. */
function classify(s: Seg, p: Seg): number {
  const dx = p.v2.x - p.v1.x;
  const dy = p.v2.y - p.v1.y;
  const length = Math.hypot(dx, dy);
  const a = sideOf(s.v1.x, s.v1.y, p.v1.x, p.v1.y, dx, dy) / length;
  const b = sideOf(s.v2.x, s.v2.y, p.v1.x, p.v1.y, dx, dy) / length;
  if (Math.abs(a) < EPS && Math.abs(b) < EPS) {
    // Sur la droite elle-même : devant s'il va dans le même sens.
    return (s.v2.x - s.v1.x) * dx + (s.v2.y - s.v1.y) * dy > 0 ? FRONT : BACK;
  }
  if (a > -EPS && b > -EPS) return FRONT;
  if (a < EPS && b < EPS) return BACK;
  return SPLIT;
}

/** Coupe un seg par la droite d'un autre : le morceau de devant, puis celui de derrière. */
function splitSeg(s: Seg, p: Seg, vertices: Vertices): [Seg, Seg] {
  const dx = p.v2.x - p.v1.x;
  const dy = p.v2.y - p.v1.y;
  const a = sideOf(s.v1.x, s.v1.y, p.v1.x, p.v1.y, dx, dy);
  const b = sideOf(s.v2.x, s.v2.y, p.v1.x, p.v1.y, dx, dy);
  const t = a / (a - b);
  const snap = (v: number) => Math.round(v * 64) / 64;
  const cut = vertices.at(snap(s.v1.x + (s.v2.x - s.v1.x) * t), snap(s.v1.y + (s.v2.y - s.v1.y) * t));
  const first: Seg = { ...s, v2: cut, length: Math.hypot(cut.x - s.v1.x, cut.y - s.v1.y), split: true };
  const second: Seg = {
    ...s,
    v1: cut,
    offset: s.offset + first.length,
    length: Math.hypot(s.v2.x - cut.x, s.v2.y - cut.y),
    split: true,
  };
  return a > 0 ? [first, second] : [second, first];
}

/** Convexe : chaque seg a tous les autres devant lui. */
function isConvex(segs: readonly Seg[]): boolean {
  return segs.every((p) => segs.every((s) => s === p || classify(s, p) === FRONT));
}

/** La découpe qui coupe le moins de segs et partage le mieux les deux côtés. */
function choosePartition(segs: readonly Seg[]): Seg {
  let best: Seg | null = null;
  let bestCost = Infinity;
  for (const p of segs) {
    let front = 0;
    let back = 0;
    let splits = 0;
    for (const s of segs) {
      const c = classify(s, p);
      if (c === FRONT) front++;
      else if (c === BACK) back++;
      else splits++;
    }
    // Une droite qui laisse tout devant elle ne découpe rien.
    if (back + splits === 0) continue;
    const cost = splits * 8 + Math.abs(front - back);
    if (cost < bestCost) {
      bestCost = cost;
      best = p;
    }
  }
  return best!;
}

const pointsOf = (segs: readonly Seg[]) => segs.flatMap((s) => [s.v1, s.v2]);

function buildTree(segs: readonly Seg[], cell: readonly Vertex[], depth: number, tree: Collected, vertices: Vertices): BspChild {
  if (isConvex(segs)) {
    const leaf: Subsector = { index: tree.subsectors.length, segs, sector: segs[0].front, cell };
    for (const s of segs) {
      s.index = tree.segs.length;
      tree.segs.push(s);
    }
    tree.subsectors.push(leaf);
    return { leaf };
  }
  const p = choosePartition(segs);
  const front: Seg[] = [];
  const back: Seg[] = [];
  for (const s of segs) {
    const c = classify(s, p);
    if (c === FRONT) front.push(s);
    else if (c === BACK) back.push(s);
    else {
      const [f, b] = splitSeg(s, p, vertices);
      front.push(f);
      back.push(b);
    }
  }
  const x = p.v1.x;
  const y = p.v1.y;
  const dx = p.v2.x - p.v1.x;
  const dy = p.v2.y - p.v1.y;
  const frontChild = buildTree(front, clipConvex(cell, x, y, dx, dy, 1), depth + 1, tree, vertices);
  const backChild = buildTree(back, clipConvex(cell, x, y, dx, dy, -1), depth + 1, tree, vertices);
  // Comme dans les fichiers de Doom, un nœud vient après ses enfants : la racine est le dernier.
  const node: BspNode = {
    index: tree.nodes.length,
    depth,
    x,
    y,
    dx,
    dy,
    boxes: [boxOf(pointsOf(front)), boxOf(pointsOf(back))],
    children: [frontChild, backChild],
    cut: chordOf(cell, x, y, dx, dy),
  };
  tree.nodes.push(node);
  return { node };
}

/** Découpe les segs jusqu'à n'avoir que des zones convexes ; `world` borne la carte entière. */
export function buildNodes(segs: readonly Seg[], world: readonly Vertex[], vertices: Vertices): Tree {
  const tree: Collected = { nodes: [], subsectors: [], segs: [] };
  const root = buildTree(segs, world, 0, tree, vertices);
  return { root, ...tree };
}
