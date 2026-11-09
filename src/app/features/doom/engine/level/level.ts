import { Vertices, boxOf, sideOf } from './geometry';
import { SECTORS, START, SectorDef, THINGS, ThingDef } from './level-data';
import { BspNode, Level, Sector, Subsector, Thing } from './level.model';
import { compileMap } from './map-compiler';
import { buildNodes } from './node-builder';

/** 0 si le point est devant le nœud (ou sur sa découpe), 1 s'il est derrière. */
export function pointSide(node: BspNode, x: number, y: number): 0 | 1 {
  return sideOf(x, y, node.x, node.y, node.dx, node.dy) >= 0 ? 0 : 1;
}

/** La zone convexe qui contient un point : on descend l'arbre, côté par côté. */
export function subsectorAt(level: Level, x: number, y: number): Subsector {
  let child = level.root;
  while (child.node) child = child.node.children[pointSide(child.node, x, y)];
  return child.leaf;
}

/** Le point est-il dans le secteur, et pas dans un pilier ? (règle du nombre de tours) */
export function insideSector(sector: Sector, x: number, y: number): boolean {
  let winding = 0;
  for (const loop of sector.loops) {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      if (a.y <= y) {
        if (b.y > y && sideOf(x, y, a.x, a.y, b.x - a.x, b.y - a.y) < 0) winding++;
      } else if (b.y <= y && sideOf(x, y, a.x, a.y, b.x - a.x, b.y - a.y) > 0) winding--;
    }
  }
  return winding !== 0;
}

const deg = (a: number): number => (a * Math.PI) / 180;

/** Compile un niveau : secteurs → lignes → segs → arbre BSP, puis pose les objets. */
export function buildLevel(
  defs: readonly SectorDef[] = SECTORS,
  thingDefs: readonly ThingDef[] = THINGS,
  start: { readonly x: number; readonly y: number; readonly angle: number } = START,
): Level {
  const vertices = new Vertices();
  const map = compileMap(defs, vertices);
  const bounds = boxOf(vertices.all());
  const m = 64;
  const world = [
    { x: bounds.minX - m, y: bounds.minY - m },
    { x: bounds.minX - m, y: bounds.maxY + m },
    { x: bounds.maxX + m, y: bounds.maxY + m },
    { x: bounds.maxX + m, y: bounds.minY - m },
  ];
  const tree = buildNodes(map.segs, world, vertices);
  const level: Level = {
    sectors: map.sectors,
    lines: map.lines,
    segs: tree.segs,
    subsectors: tree.subsectors,
    nodes: tree.nodes,
    root: tree.root,
    things: [],
    doors: map.sectors.filter((s) => s.door),
    bounds,
    start: { x: start.x, y: start.y, angle: deg(start.angle) },
    rooms: [...new Set(map.sectors.map((s) => s.room))],
    stats: {
      sectors: map.sectors.length,
      lines: map.lines.length,
      twoSided: map.lines.filter((l) => l.back).length,
      segs: tree.segs.length,
      splits: tree.segs.filter((s) => s.split).length,
      nodes: tree.nodes.length,
      subsectors: tree.subsectors.length,
      things: thingDefs.length,
      depth: Math.max(0, ...tree.nodes.map((n) => n.depth + 1)),
    },
  };
  const things = thingDefs.map((def, index): Thing => {
    const sector = subsectorAt(level, def.x, def.y).sector;
    const thing: Thing = {
      index,
      kind: def.kind,
      x: def.x,
      y: def.y,
      angle: deg(def.angle ?? 0),
      sector,
      z: def.floor ?? sector.floor,
      hidden: def.hidden ?? false,
    };
    // Un objet caché n'est dans la liste d'aucun secteur : le rendu normal ne le projette jamais.
    if (!thing.hidden) sector.things.push(thing);
    return thing;
  });
  return { ...level, things };
}
