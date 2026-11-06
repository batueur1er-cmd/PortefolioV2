import { EPS, Vertices, sideOf, signedArea } from './geometry';
import { MapPoint, SectorDef, WallTexture } from './level-data';
import { Line, Sector, Seg, Side, Vertex } from './level.model';

/*
 * Ce que faisait l'éditeur de cartes : des secteurs dessinés vus de dessus, il tire les lignes
 * (linedefs), leurs côtés (sidedefs) et les segs. Une arête vue d'un seul secteur est un mur plein ;
 * vue des deux côtés, c'est une ouverture.
 */

interface Edge {
  readonly a: Vertex;
  readonly b: Vertex;
  readonly wall: WallTexture | null;
  readonly sector: Sector;
}

export interface CompiledMap {
  readonly sectors: Sector[];
  readonly lines: Line[];
  readonly segs: Seg[];
}

/** Les arêtes d'un contour, orientées pour garder l'intérieur du secteur à droite. */
function loopEdges(points: readonly MapPoint[], wall: WallTexture | null, sector: Sector, vertices: Vertices, hole: boolean) {
  const verts = points.map(([x, y]) => vertices.at(x, y));
  let edges: Edge[] = verts.map((a, i) => ({ a, b: verts[(i + 1) % verts.length], wall: points[i][2] ?? wall, sector }));
  // Contour extérieur dans le sens des aiguilles d'une montre, trous dans l'autre sens.
  const clockwise = signedArea(verts) < 0;
  if (clockwise === hole) edges = edges.reverse().map((e) => ({ ...e, a: e.b, b: e.a }));
  return { edges, loop: edges.map((e) => e.a) };
}

/** Coupe les arêtes là où un sommet d'un autre secteur se pose dessus (les « jonctions en T »). */
function splitAtVertices(edges: readonly Edge[], vertices: readonly Vertex[]): Edge[] {
  const out: Edge[] = [];
  for (const edge of edges) {
    const dx = edge.b.x - edge.a.x;
    const dy = edge.b.y - edge.a.y;
    const length2 = dx * dx + dy * dy;
    const inner = vertices
      .filter((v) => v !== edge.a && v !== edge.b)
      .map((v) => ({ v, t: ((v.x - edge.a.x) * dx + (v.y - edge.a.y) * dy) / length2 }))
      .filter(({ v, t }) => t > 0 && t < 1 && Math.abs(sideOf(v.x, v.y, edge.a.x, edge.a.y, dx, dy)) / Math.sqrt(length2) < EPS)
      .sort((p, q) => p.t - q.t);
    let from = edge.a;
    for (const { v } of inner) {
      out.push({ ...edge, a: from, b: v });
      from = v;
    }
    out.push({ ...edge, a: from });
  }
  return out;
}

function buildSectors(defs: readonly SectorDef[], vertices: Vertices) {
  const sectors: Sector[] = [];
  const edges: Edge[] = [];
  defs.forEach((def, index) => {
    const loops: Vertex[][] = [];
    const sector: Sector = {
      index,
      id: def.id,
      room: def.room,
      floor: def.floor,
      ceiling: def.ceiling,
      floorFlat: def.floorFlat,
      ceilingFlat: def.ceilingFlat,
      sky: def.ceilingFlat === null,
      light: def.light,
      dimLight: def.dimLight ?? null,
      upper: def.upper ?? null,
      lower: def.lower ?? null,
      wall: def.wall,
      loops,
      things: [],
    };
    const outer = loopEdges(def.outline, def.wall, sector, vertices, false);
    loops.push(outer.loop);
    edges.push(...outer.edges);
    for (const hole of def.holes ?? []) {
      const inner = loopEdges(hole.points, hole.wall, sector, vertices, true);
      loops.push(inner.loop);
      edges.push(...inner.edges);
    }
    sectors.push(sector);
  });
  return { sectors, edges };
}

/**
 * Les textures d'un côté. Mur plein : celle du mur. Ouverture : au-dessus, le mur du secteur où
 * l'on se tient ; au-dessous, la contremarche du secteur d'en face (une marche porte la sienne).
 */
function sideOfSector(sector: Sector, other: Sector | null, wall: WallTexture | null): Side {
  if (!other) return { sector, upper: null, mid: wall ?? sector.wall, lower: null };
  return { sector, upper: sector.upper ?? sector.wall, mid: null, lower: other.lower ?? sector.lower ?? sector.wall };
}

function buildLines(edges: readonly Edge[]): Line[] {
  const byKey = new Map<string, Edge[]>();
  const key = (p: Vertex, q: Vertex) => {
    const [m, n] = p.x < q.x || (p.x === q.x && p.y < q.y) ? [p, q] : [q, p];
    return `${m.x},${m.y}:${n.x},${n.y}`;
  };
  for (const edge of edges) {
    const k = key(edge.a, edge.b);
    const list = byKey.get(k);
    if (list) list.push(edge);
    else byKey.set(k, [edge]);
  }
  const lines: Line[] = [];
  for (const pair of byKey.values()) {
    const [first, second] = pair;
    // Deux secteurs ne se recouvrent jamais : une arête partagée est parcourue une fois dans chaque sens.
    if (pair.length > 2 || (second && (second.a !== first.b || second.sector === first.sector))) {
      throw new Error(`Carte invalide autour de (${first.a.x}, ${first.a.y}) – (${first.b.x}, ${first.b.y})`);
    }
    const back = second?.sector ?? null;
    lines.push({
      index: lines.length,
      v1: first.a,
      v2: first.b,
      front: sideOfSector(first.sector, back, first.wall),
      back: back ? sideOfSector(back, first.sector, second.wall) : null,
    });
  }
  return lines;
}

/** Un seg par côté de ligne : un pour un mur plein, deux pour une ouverture. */
function buildSegs(lines: readonly Line[]): Seg[] {
  const segs: Seg[] = [];
  const seg = (line: Line, side: 0 | 1): Seg => {
    const [v1, v2] = side === 0 ? [line.v1, line.v2] : [line.v2, line.v1];
    const sidedef = side === 0 ? line.front : line.back!;
    const other = side === 0 ? line.back : line.front;
    return {
      index: 0,
      v1,
      v2,
      line,
      side,
      offset: 0,
      length: Math.hypot(v2.x - v1.x, v2.y - v1.y),
      front: sidedef.sector,
      back: other?.sector ?? null,
      sidedef,
      split: false,
    };
  };
  for (const line of lines) {
    segs.push(seg(line, 0));
    if (line.back) segs.push(seg(line, 1));
  }
  return segs;
}

export function compileMap(defs: readonly SectorDef[], vertices: Vertices): CompiledMap {
  const { sectors, edges } = buildSectors(defs, vertices);
  const lines = buildLines(splitAtVertices(edges, vertices.all()));
  return { sectors, lines, segs: buildSegs(lines) };
}
