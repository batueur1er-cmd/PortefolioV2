import { LightTables, buildLightTables } from './color/light-tables';
import { Palette, RAMP_COLORS, Rgb, buildPalette, parseColor } from './color/palette';
import { buildGraphics } from './graphics/graphics';
import { Graphics } from './graphics/graphics.model';
import { buildLevel } from './level/level';
import { Level } from './level/level.model';
import { Obstacle } from './play/collision';
import { Renderer } from './render/renderer';
import { HiddenBox } from './render/things';
import { FrameStats, FrameTrace, View } from './render/render.model';
import { XrayColors, paintHeat, paintSurface, paintXray } from './render/screen';

/*
 * La façade du moteur : le reste de la démo (la page, ses composants, son état) ne passe que par
 * ce fichier. Le moteur lui-même est en TypeScript pur, sans Angular ni rien du reste du site,
 * et ses modules ne dépendent que de ceux autorisés (règle vérifiée par scripts/check-architecture.mjs) :
 *
 *   level/    le niveau : sa description, la compilation de la carte et le node builder (BSP)
 *   color/    la palette de 256 couleurs, les tables d'ombre et de lumière
 *   graphics/ les images : textures des murs, sols, ciel, sprites
 *   render/   le rendu d'une image : arbre, murs, visplanes, sprites, puis couleurs ou rayons X
 *   play/     le joueur : tics, élan, collisions
 *   automap/  la carte vue de dessus
 */

export type { Level, LevelStats, Sector, Thing } from './level/level.model';
export { insideSector, subsectorAt } from './level/level';
export type { Rgb } from './color/palette';
export { RAMP_COLORS, parseColor } from './color/palette';
export type { FrameStats, FrameTrace, View } from './render/render.model';
export { DEFAULT_FOV, MAX_FOV, MAX_VISPLANES, MIN_FOV, SCREEN_H, SCREEN_W } from './render/render.model';
export type { XrayColors } from './render/screen';
export type { HiddenBox } from './render/things';
export { Player } from './play/player';
export { Doors } from './play/doors';
export type { PlayerInput } from './play/player';
export { TICRATE, TIC_MS } from './play/physics';
export { drawMap, mapFrame, mapToWorld } from './automap/automap';
export type { MapColors, MapScene } from './automap/automap';

export interface DoomAssets {
  readonly level: Level;
  readonly graphics: Graphics;
  readonly lights: LightTables;
}

let shared: DoomAssets | null = null;

/** Le niveau compilé (avec son arbre BSP) et les images : calculés une fois, partagés par toutes les copies. */
export function doomAssets(): DoomAssets {
  shared ??= { level: buildLevel(), graphics: buildGraphics(), lights: buildLightTables() };
  return shared;
}

export interface FrameResult {
  readonly stats: FrameStats;
  readonly trace: FrameTrace | null;
}

/** Le moteur d'une page : un niveau, une palette (celle du thème) et un renderer avec son image. */
export class DoomEngine {
  readonly level: Level;
  /** Les objets qui bloquent le passage, avec leur encombrement. */
  readonly obstacles: readonly Obstacle[];
  private readonly renderer: Renderer;
  private palette: Palette;
  private paletteKey = '';
  private last: FrameResult | null = null;
  private painter = false;

  constructor() {
    const assets = doomAssets();
    this.level = assets.level;
    this.renderer = new Renderer(assets.level, assets.graphics, assets.lights);
    this.obstacles = assets.level.things
      .filter((t) => !t.hidden)
      .map((t) => ({ x: t.x, y: t.y, radius: assets.graphics.sprites[t.kind].radius }));
    this.palette = buildPalette(RAMP_COLORS.map(([, fallback]) => parseColor(fallback, fallback)));
  }

  /** Les 16 teintes du thème ; la palette et ses tables d'ombre ne sont refaites que si elles changent. */
  setColors(bases: readonly Rgb[]): boolean {
    const key = bases.map((c) => c.join(',')).join('|');
    if (key === this.paletteKey) return false;
    this.paletteKey = key;
    this.palette = buildPalette(bases);
    return true;
  }

  /** Une image ; aux rayons X, avec les objets cachés dans les murs. */
  render(view: View, budget = Infinity, trace = false, xray = false): FrameResult {
    this.painter = !!view.painter;
    this.last = this.renderer.render(view, this.palette, budget, trace, xray);
    return this.last;
  }

  /** Les objets cachés visibles sur la dernière image aux rayons X. */
  get hiddenBoxes(): readonly HiddenBox[] {
    return this.renderer.hiddenBoxes;
  }

  /** Passe la dernière image en couleurs, telle quelle ou aux rayons X. */
  paint(out: Uint32Array, xray: XrayColors | null): void {
    if (xray && this.painter) paintHeat(this.renderer.frame, xray, out);
    else if (xray) paintXray(this.renderer.frame, this.palette, xray, this.last?.stats.walls ?? 0, out);
    else paintSurface(this.renderer.frame, this.palette, out);
  }
}
