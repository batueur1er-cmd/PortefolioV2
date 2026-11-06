import { sideOf } from './geometry';
import { buildLevel, insideSector, subsectorAt } from './level';
import { SECTORS, rect } from './level-data';

describe('Le node builder', () => {
  const level = buildLevel();

  it('change les secteurs dessinés en murs pleins et en ouvertures', () => {
    expect(level.stats.sectors).toBe(SECTORS.length);
    expect(level.stats.twoSided).toBeGreaterThan(10);
    expect(level.stats.lines).toBeGreaterThan(level.stats.twoSided);
    expect(level.lines.filter((l) => l.back).every((l) => l.front.sector !== l.back!.sector)).toBe(true);
  });

  it('découpe le niveau en zones convexes, chacune dans un seul secteur', () => {
    for (const ss of level.subsectors) {
      expect(ss.segs.every((s) => s.front === ss.sector)).toBe(true);
      for (const p of ss.segs) {
        const dx = p.v2.x - p.v1.x;
        const dy = p.v2.y - p.v1.y;
        const length = Math.hypot(dx, dy);
        for (const s of ss.segs) {
          expect(sideOf(s.v1.x, s.v1.y, p.v1.x, p.v1.y, dx, dy) / length).toBeGreaterThan(-0.01);
          expect(sideOf(s.v2.x, s.v2.y, p.v1.x, p.v1.y, dx, dy) / length).toBeGreaterThan(-0.01);
        }
      }
    }
  });

  it('range chaque seg dans une seule zone et place la racine en dernier, comme Doom', () => {
    const counted = level.subsectors.reduce((n, ss) => n + ss.segs.length, 0);
    expect(counted).toBe(level.stats.segs);
    expect(level.segs.map((s) => s.index)).toEqual(level.segs.map((_, i) => i));
    expect(level.root.node).toBe(level.nodes[level.nodes.length - 1]);
    expect(level.stats.subsectors).toBe(level.stats.nodes + 1);
    expect(level.stats.splits).toBeGreaterThan(0);
  });

  it('retrouve la zone d’un point en descendant l’arbre', () => {
    expect(subsectorAt(level, 100, 100).sector.id).toBe('hall');
    expect(subsectorAt(level, 760, 256).sector.id).toBe('couloir');
    expect(subsectorAt(level, 900, 900).sector.id).toBe('bassin');
    expect(subsectorAt(level, 300, 600).sector.id).toBe('marche-2');
    expect(subsectorAt(level, 460, 830).sector.id).toBe('fenetre');
    // Un pilier n'appartient à aucun secteur : la zone trouvée ne le contient pas.
    expect(insideSector(subsectorAt(level, 320, 256).sector, 320, 256)).toBe(false);
  });

  it('pose chaque objet dans son secteur', () => {
    const robot = level.things.find((t) => t.kind === 'robot')!;
    expect(robot.sector.id).toBe('cour');
    expect(robot.sector.things).toContain(robot);
    expect(level.things.length).toBe(level.stats.things);
  });

  it('refuse deux secteurs qui se chevauchent', () => {
    const base = { room: 'test', floor: 0, ceiling: 128, floorFlat: 'dalles', ceilingFlat: 'plafond', light: 160, wall: 'pierre' } as const;
    const overlap = [
      { ...base, id: 'a', outline: rect(0, 0, 128, 128) },
      { ...base, id: 'b', outline: rect(0, 0, 128, 128) },
    ];
    expect(() => buildLevel(overlap, [], { x: 64, y: 64, angle: 0 })).toThrow(/Carte invalide/);
  });
});
