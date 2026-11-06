import { COLORMAPS, Palette } from '../color/palette';
import { CENTER_X, FOCAL, FrameStats, FrameTrace, SCREEN_H, SCREEN_W, VOID_COLOR, View, emptyStats } from './render.model';

/**
 * L'image en cours de calcul, partagée par toutes les passes du rendu : ses pixels, ce qui les a
 * peints, les bornes encore libres de chaque colonne, la vue, et le budget du rendu au ralenti.
 */
export class Frame {
  /** Un indice de la palette par pixel. */
  readonly pixels = new Uint8Array(SCREEN_W * SCREEN_H);
  /** Qui a peint chaque pixel (0 : personne). */
  readonly owner = new Uint16Array(SCREEN_W * SCREEN_H);
  /** Pour chaque colonne, la dernière ligne déjà prise en haut et la première prise en bas. */
  readonly ceilingClip = new Int16Array(SCREEN_W);
  readonly floorClip = new Int16Array(SCREEN_W);
  /** Angle de chaque colonne par rapport au regard. */
  readonly columnAngle = Float64Array.from({ length: SCREEN_W }, (_, x) => Math.atan((CENTER_X - x - 0.5) / FOCAL));

  x = 0;
  y = 0;
  z = 0;
  angle = 0;
  cos = 1;
  sin = 0;
  tic = 0;
  colormaps: Uint8Array = new Uint8Array(COLORMAPS * 256);
  stats: FrameStats = emptyStats();
  trace: FrameTrace | null = null;
  /** Opérations de dessin comptées depuis le début de l'image. */
  ops = 0;
  private budget = Infinity;

  begin(view: View, palette: Palette, budget: number, trace: boolean): void {
    this.x = view.x;
    this.y = view.y;
    this.z = view.z;
    this.angle = view.angle;
    this.cos = Math.cos(view.angle);
    this.sin = Math.sin(view.angle);
    this.tic = view.tic;
    this.colormaps = palette.colormaps;
    this.budget = budget;
    this.ops = 0;
    this.stats = emptyStats();
    this.trace = trace ? { visits: [], walls: [], planes: [], sprites: [] } : null;
    this.pixels.fill(VOID_COLOR);
    this.owner.fill(0);
    this.ceilingClip.fill(-1);
    this.floorClip.fill(SCREEN_H);
  }

  /**
   * Compte une opération de dessin. Une fois le budget du ralenti épuisé, elle renvoie false : le
   * calcul continue (chaque étape tombe au même moment), mais plus rien n'est peint.
   */
  spend(): boolean {
    return this.ops++ < this.budget;
  }
}
