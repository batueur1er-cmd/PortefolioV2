import { LightTables } from '../color/light-tables';
import { Palette } from '../color/palette';
import { Graphics } from '../graphics/graphics.model';
import { Level } from '../level/level.model';
import { Bsp } from './bsp';
import { Frame } from './frame';
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

  constructor(level: Level, graphics: Graphics, lights: LightTables) {
    this.planes = new Planes(this.frame, graphics, lights);
    this.segs = new Segs(this.frame, this.planes, graphics, lights);
    this.things = new Things(this.frame, this.segs, graphics, lights, level.sectors.length);
    this.bsp = new Bsp(level, this.frame, this.planes, this.segs, this.things);
  }

  /**
   * Dessine une image. `budget` borne le nombre d'opérations de dessin (rendu au ralenti) ; tout le
   * reste du calcul est fait quand même, pour que chaque étape tombe au même moment.
   */
  render(view: View, palette: Palette, budget = Infinity, trace = false): { stats: FrameStats; trace: FrameTrace | null } {
    const f = this.frame;
    f.begin(view, palette, budget, trace);
    this.planes.reset();
    this.segs.reset();
    this.things.reset();
    this.bsp.reset();

    this.bsp.walk();
    f.stats.wallOps = f.ops;
    this.planes.draw();
    f.stats.planeOps = f.ops - f.stats.wallOps;
    this.things.draw();
    f.stats.spriteOps = f.ops - f.stats.wallOps - f.stats.planeOps;
    f.stats.ops = f.ops;
    f.stats.visplanes = this.planes.count;
    return { stats: f.stats, trace: f.trace };
  }
}
