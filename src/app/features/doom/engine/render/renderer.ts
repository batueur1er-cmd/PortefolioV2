import { LightTables } from '../color/light-tables';
import { Palette } from '../color/palette';
import { Graphics } from '../graphics/graphics.model';
import { Level, Thing } from '../level/level.model';
import { Bsp } from './bsp';
import { Frame } from './frame';
import { Painter } from './painter';
import { Planes } from './planes';
import { FrameStats, FrameTrace, View } from './render.model';
import { Segs } from './segs';
import { Things } from './things';

/*
 * Une image, étape par étape, comme Doom (1993) dans R_RenderPlayerView (r_main) :
 *   1. l'arbre BSP est parcouru du plus proche au plus lointain, et les murs sont peints en bandes
 *      verticales (bsp.ts, segs.ts) ;
 *   2. les sols et plafonds notés au passage sont peints en lignes (planes.ts) ;
 *   3. les objets sont triés et peints du plus loin au plus proche (things.ts).
 * L'image fait 320 × 200 pixels dans une palette de 256 couleurs ; la lumière passe par des tables.
 * L'écriture est la nôtre (en nombres à virgule, pas en virgule fixe) ; la méthode est celle de Doom.
 */
export class Renderer {
  readonly frame = new Frame();
  private readonly planes: Planes;
  private readonly segs: Segs;
  private readonly things: Things;
  private readonly bsp: Bsp;
  private readonly painter: Painter;
  /** Les objets cachés dans les murs, que seuls les rayons X montrent. */
  private readonly hidden: readonly Thing[];

  constructor(
    private readonly level: Level,
    graphics: Graphics,
    lights: LightTables,
  ) {
    this.hidden = level.things.filter((t) => t.hidden);
    this.planes = new Planes(this.frame, graphics, lights);
    this.segs = new Segs(this.frame, this.planes, graphics, lights);
    this.things = new Things(this.frame, this.segs, graphics, lights, level.sectors.length);
    this.bsp = new Bsp(level, this.frame, this.planes, this.segs, this.things);
    this.painter = new Painter(level, this.frame, graphics, lights, this.things);
  }

  /**
   * Dessine une image. `budget` borne le nombre d'opérations de dessin (rendu au ralenti) ; tout le
   * reste du calcul est fait quand même, pour que chaque étape tombe au même moment. Aux rayons X
   * (`xray`), l'image finie reçoit en plus les objets cachés dans les murs.
   */
  render(view: View, palette: Palette, budget = Infinity, trace = false, xray = false): { stats: FrameStats; trace: FrameTrace | null } {
    const f = this.frame;
    view.doors?.forEach((height, i) => (this.level.doors[i].ceiling = height));
    f.begin(view, palette, budget, trace);
    this.planes.reset();
    this.segs.reset();
    this.things.reset();
    this.bsp.reset();

    if (view.painter) {
      this.painter.walk();
      f.stats.wallOps = f.ops;
    } else {
      this.bsp.walk();
      f.stats.wallOps = f.ops;
      this.planes.draw();
      f.stats.planeOps = f.ops - f.stats.wallOps;
      this.things.draw();
      f.stats.spriteOps = f.ops - f.stats.wallOps - f.stats.planeOps;
    }
    // Les objets cachés ne comptent pas : les deux fenêtres annoncent les mêmes chiffres.
    const pixels = f.stats.pixels;
    if (xray && f.complete) this.things.drawHidden(this.hidden);
    f.stats.pixels = pixels;
    f.stats.ops = f.ops;
    f.stats.visplanes = this.planes.count;
    return { stats: f.stats, trace: f.trace };
  }
}
