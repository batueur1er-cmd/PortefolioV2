import { Box, Vertex } from './level.model';

/** Tolérance des calculs de côté, en unités de carte. */
export const EPS = 1e-3;

/** Côté d'un point par rapport à une droite orientée : positif à droite (l'avant). */
export function sideOf(px: number, py: number, x: number, y: number, dx: number, dy: number): number {
  return (px - x) * dy - (py - y) * dx;
}

/** Aire signée d'un contour : positive dans le sens inverse des aiguilles d'une montre. */
export function signedArea(points: readonly Vertex[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

export function boxOf(points: Iterable<Vertex>): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of points) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }
  return { minX, minY, maxX, maxY };
}

/** Garde la partie d'un polygone convexe d'un côté d'une droite (1 : devant, -1 : derrière). */
export function clipConvex(cell: readonly Vertex[], x: number, y: number, dx: number, dy: number, keep: 1 | -1): Vertex[] {
  const out: Vertex[] = [];
  for (let i = 0; i < cell.length; i++) {
    const p = cell[i];
    const q = cell[(i + 1) % cell.length];
    const sp = keep * sideOf(p.x, p.y, x, y, dx, dy);
    const sq = keep * sideOf(q.x, q.y, x, y, dx, dy);
    if (sp >= 0) out.push(p);
    if (sp >= 0 !== sq >= 0) {
      const t = sp / (sp - sq);
      out.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return out;
}

/** Une droite bornée à un polygone convexe : ses deux points de sortie. */
export function chordOf(cell: readonly Vertex[], x: number, y: number, dx: number, dy: number): [Vertex, Vertex] {
  const points: Vertex[] = [];
  for (let i = 0; i < cell.length; i++) {
    const p = cell[i];
    const q = cell[(i + 1) % cell.length];
    const sp = sideOf(p.x, p.y, x, y, dx, dy);
    const sq = sideOf(q.x, q.y, x, y, dx, dy);
    if (sp === 0) points.push(p);
    else if (sp > 0 !== sq > 0 && sq !== 0) {
      const t = sp / (sp - sq);
      points.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return [points[0] ?? { x, y }, points[points.length - 1] ?? { x: x + dx, y: y + dy }];
}

/** Les sommets du niveau, dédoublonnés : deux secteurs qui partagent un coin partagent le même sommet. */
export class Vertices {
  private readonly byKey = new Map<string, Vertex>();

  at(x: number, y: number): Vertex {
    const key = `${x},${y}`;
    let v = this.byKey.get(key);
    if (!v) {
      v = { x, y };
      this.byKey.set(key, v);
    }
    return v;
  }

  all(): Vertex[] {
    return [...this.byKey.values()];
  }
}
