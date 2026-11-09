import { COLORMAPS, Palette } from '../color/palette';
import { CENTER_X, DEFAULT_FOV, FrameStats, FrameTrace, SCREEN_H, SCREEN_W, VOID_COLOR, View, emptyStats, focalOf } from './render.model';

/**
 * L'image en cours de calcul, partagée par toutes les passes du rendu : ses pixels, ce qui les a
 * peints, les bornes encore libres de chaque colonne, la vue, et le budget du rendu au ralenti.
 */
export class Frame {
  /** Un indice de la palette par pixel. */
  readonly pixels = new Uint8Array(SCREEN_W * SCREEN_H);
  /** Qui a peint chaque pixel (0 : personne). */
  readonly owner = new Uint16Array(SCREEN_W * SCREEN_H);
  /** Combien de fois chaque pixel a été écrit. */
  readonly overdraw = new Uint8Array(SCREEN_W * SCREEN_H);
  /** Pour chaque colonne, la dernière ligne déjà prise en haut et la première prise en bas. */
  readonly ceilingClip = new Int16Array(SCREEN_W);
  readonly floorClip = new Int16Array(SCREEN_W);
  /** Angle de chaque colonne par rapport au regard. */
  readonly columnAngle = new Float64Array(SCREEN_W);
  /** Distance focale en pixels : plus elle est courte, plus le champ de vision est large. */
  focal = 0;
  /** Tangente du demi-champ de vision : un point est visible si |l| ≤ z · tanHalf. */
  tanHalf = 1;
  fovHalf = Math.PI / 4;
  /** Rapport à la focale de Doom : les tables de lumière restent calées sur la distance, pas sur le zoom. */
  lightRatio = 1;

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
    this.setFov(view.fov ?? DEFAULT_FOV);
    this.colormaps = palette.colormaps;
    this.budget = budget;
    this.ops = 0;
    this.stats = emptyStats();
    this.trace = trace ? { visits: [], walls: [], planes: [], sprites: [] } : null;
    this.pixels.fill(VOID_COLOR);
    this.owner.fill(0);
    this.overdraw.fill(0);
    this.ceilingClip.fill(-1);
    this.floorClip.fill(SCREEN_H);
  }

  private setFov(fov: number): void {
    const focal = focalOf(fov);
    if (focal === this.focal) return;
    this.focal = focal;
    this.fovHalf = (fov * Math.PI) / 360;
    this.tanHalf = CENTER_X / focal;
    this.lightRatio = focalOf(DEFAULT_FOV) / focal;
    for (let x = 0; x < SCREEN_W; x++) this.columnAngle[x] = Math.atan((CENTER_X - x - 0.5) / focal);
  }

  /** Note un pixel écrit (un pinceau l'appelle à chaque écriture). */
  count(i: number): void {
    this.stats.pixels++;
    if (this.overdraw[i] < 255) this.overdraw[i]++;
  }

  /**
   * Compte une opération de dessin. Une fois le budget du ralenti épuisé, elle renvoie false : le
   * calcul continue (chaque étape tombe au même moment), mais plus rien n'est peint.
   */
  spend(): boolean {
    return this.ops++ < this.budget;
  }

  /** Toutes les opérations de l'image ont tenu dans le budget : l'image est finie. */
  get complete(): boolean {
    return this.ops <= this.budget;
  }
}
