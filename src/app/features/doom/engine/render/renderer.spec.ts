import { buildLightTables } from '../color/light-tables';
import { RAMP_COLORS, buildPalette, parseColor } from '../color/palette';
import { buildGraphics } from '../graphics/graphics';
import { buildLevel, subsectorAt } from '../level/level';
import { OWNER, OWNER_SHIFT, View } from './render.model';
import { Renderer } from './renderer';

describe('Le rendu façon Doom', () => {
  const level = buildLevel();
  const palette = buildPalette(RAMP_COLORS.map(([, fallback]) => parseColor(fallback, fallback)));
  const renderer = new Renderer(level, buildGraphics(), buildLightTables());
  const start: View = { x: 96, y: 96, z: 41, angle: Math.PI / 4, tic: 0 };
  const COUR: View = { x: 1200, y: 760, z: 9, angle: Math.PI * 0.75, tic: 0 };
  const kinds = () => new Set([...renderer.frame.owner].map((o) => o >> OWNER_SHIFT));

  it('peint chaque pixel de l’image', () => {
    const { stats } = renderer.render(start, palette);
    expect([...renderer.frame.owner].every((o) => o !== 0)).toBe(true);
    expect(stats.walls).toBeGreaterThan(0);
    expect(stats.visplanes).toBeGreaterThan(0);
    expect(stats.spans).toBeGreaterThan(0);
    expect(stats.ops).toBe(stats.wallOps + stats.planeOps + stats.spriteOps);
  });

  it('commence par la zone où se tient le joueur, puis écarte des sous-arbres cachés', () => {
    const { stats, trace } = renderer.render(start, palette, Infinity, true);
    expect(trace!.visits[0].subsector).toBe(subsectorAt(level, start.x, start.y).index);
    expect(stats.culled).toBeGreaterThan(0);
    expect(stats.subsectors).toBeLessThan(level.stats.subsectors);
  });

  it('change de champ de vision sans laisser de trou, et voit plus de zones en grand angle', () => {
    for (const fov of [60, 120]) {
      renderer.render({ ...start, fov }, palette);
      expect([...renderer.frame.owner].every((o) => o !== 0)).toBe(true);
    }
    const narrow = renderer.render({ ...COUR, fov: 60 }, palette).stats.subsectors;
    const wide = renderer.render({ ...COUR, fov: 120 }, palette).stats.subsectors;
    expect(wide).toBeGreaterThan(narrow);
  });

  it('reste sous les limites de Doom', () => {
    const { stats } = renderer.render({ x: 700, y: 1100, z: 9, angle: -Math.PI / 2, tic: 0 }, palette);
    expect(stats.visplanes).toBeLessThanOrEqual(128);
    expect(stats.walls).toBeLessThanOrEqual(256);
    expect(stats.sprites).toBeLessThanOrEqual(128);
  });

  it('dessine au ralenti : rien avec un budget nul, une partie à mi-chemin', () => {
    const total = renderer.render(start, palette).stats.ops;
    renderer.render(start, palette, 0);
    expect([...renderer.frame.owner].every((o) => o === 0)).toBe(true);
    renderer.render(start, palette, Math.floor(total / 2));
    const drawn = [...renderer.frame.owner].filter((o) => o !== 0).length;
    expect(drawn).toBeGreaterThan(0);
    expect(drawn).toBeLessThan(renderer.frame.owner.length);
  });

  it('voit le ciel depuis la cour, et les objets à leur place', () => {
    renderer.render({ x: 1200, y: 760, z: 9, angle: Math.PI * 0.75, tic: 0 }, palette);
    expect(kinds().has(OWNER.SKY)).toBe(true);
    expect(kinds().has(OWNER.SPRITE)).toBe(true);
    // Face au mur sud du hall, aucun objet.
    renderer.render({ x: 320, y: 120, z: 41, angle: -Math.PI / 2, tic: 0 }, palette);
    expect(kinds().has(OWNER.SPRITE)).toBe(false);
  });

  it('ne montre le coffre caché derrière le mur nord du hall qu’aux rayons X, une fois l’image finie', () => {
    const hidden = () => [...renderer.frame.owner].filter((o) => o >> OWNER_SHIFT === OWNER.HIDDEN).length;
    const { stats } = renderer.render(start, palette);
    expect(hidden()).toBe(0);
    renderer.render(start, palette, Infinity, false, true);
    expect(hidden()).toBeGreaterThan(0);
    // Il ne compte pas dans les opérations : les deux fenêtres rejouent la même image.
    expect(renderer.render(start, palette, Infinity, false, true).stats.ops).toBe(stats.ops);
    renderer.render(start, palette, stats.ops - 1, false, true);
    expect(hidden()).toBe(0);
  });

  it('cache un objet derrière un pilier', () => {
    const sprites = () => [...renderer.frame.owner].filter((o) => o >> OWNER_SHIFT === OWNER.SPRITE).length;
    // Le brasero, au centre de la salle des colonnes, vu entre deux piliers…
    renderer.render({ x: 1152, y: 470, z: 41, angle: -Math.PI / 2, tic: 0 }, palette);
    expect(sprites()).toBeGreaterThan(0);
    // … puis en diagonale, avec un pilier juste entre lui et le joueur.
    renderer.render({ x: 1344, y: 448, z: 41, angle: (-3 * Math.PI) / 4, tic: 0 }, palette);
    expect(sprites()).toBe(0);
  });
});
