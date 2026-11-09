import { insideSector, subsectorAt } from '../level/level';
import { Level, Sector } from '../level/level.model';
import { Obstacle, roomAt } from './collision';
import { FORWARD, FRICTION, GRAVITY, MAX_MOVE, SIDE, STOP_SPEED, TURN, VIEW_HEIGHT } from './physics';

export interface PlayerInput {
  /** -1 (reculer) à 1 (avancer). */
  readonly forward: number;
  /** -1 (à gauche) à 1 (à droite). */
  readonly strafe: number;
  /** -1 (à droite) à 1 (à gauche). */
  readonly turn: number;
  readonly run: boolean;
}

const wrapAngle = (a: number): number => {
  const turn = 2 * Math.PI;
  return ((a % turn) + turn) % turn;
};

/** Le joueur : sa position, son élan et la hauteur de ses yeux, mis à jour tic par tic. */
export class Player {
  x: number;
  y: number;
  /** Hauteur des pieds. */
  z: number;
  angle: number;
  private momX = 0;
  private momY = 0;
  private momZ = 0;
  /** Hauteur des yeux au-dessus des pieds : elle fléchit un instant quand on monte une marche. */
  private viewHeight = VIEW_HEIGHT;
  private viewSpeed = 0;
  private floorZ: number;
  private ceilingZ: number;

  constructor(
    private readonly level: Level,
    private readonly obstacles: readonly Obstacle[] = [],
  ) {
    this.x = level.start.x;
    this.y = level.start.y;
    this.angle = level.start.angle;
    const sector = this.sector;
    this.z = this.floorZ = sector.floor;
    this.ceilingZ = sector.ceiling;
  }

  get sector(): Sector {
    return subsectorAt(this.level, this.x, this.y).sector;
  }

  /** Hauteur des yeux, jamais collée au plafond. */
  get eyeZ(): number {
    return Math.min(this.z + this.viewHeight, this.ceilingZ - 4);
  }

  /** Un tic de jeu. Renvoie true si la vue a changé. */
  tic(input: PlayerInput): boolean {
    const before = [this.x, this.y, this.eyeZ, this.angle];
    const run = input.run ? 1 : 0;
    if (input.turn) this.angle = wrapAngle(this.angle + input.turn * TURN[run]);
    // On ne pousse que les pieds au sol.
    if (this.z <= this.floorZ && (input.forward || input.strafe)) {
      const f = input.forward * FORWARD[run];
      const s = input.strafe * SIDE[run];
      this.momX += f * Math.cos(this.angle) + s * Math.sin(this.angle);
      this.momY += f * Math.sin(this.angle) - s * Math.cos(this.angle);
    }
    if (this.momX || this.momY) this.moveXY();
    if (this.z <= this.floorZ) {
      const still = !input.forward && !input.strafe;
      if (still && Math.abs(this.momX) < STOP_SPEED && Math.abs(this.momY) < STOP_SPEED) {
        this.momX = 0;
        this.momY = 0;
      } else {
        this.momX *= FRICTION;
        this.momY *= FRICTION;
      }
    }
    this.moveZ();
    const after = [this.x, this.y, this.eyeZ, this.angle];
    return after.some((v, i) => Math.abs(v - before[i]) > 1e-6);
  }

  /** Tourne sur place (souris ou doigt qui glisse sur la vue). */
  turnBy(radians: number): void {
    this.angle = wrapAngle(this.angle + radians);
  }

  /** Retour au point de départ, comme au lancement du niveau. */
  respawn(): void {
    this.teleport(this.level.start.x, this.level.start.y);
    this.angle = this.level.start.angle;
  }

  /** Se rend directement à un point de la carte, s'il y a la place. */
  teleport(x: number, y: number): boolean {
    const sector = subsectorAt(this.level, x, y).sector;
    if (!insideSector(sector, x, y)) return false;
    const room = roomAt(this.level, this.obstacles, { fromX: x, fromY: y, toX: x, toY: y, z: sector.floor, teleport: true });
    if (!room) return false;
    this.x = x;
    this.y = y;
    this.z = this.floorZ = room.floor;
    this.ceilingZ = room.ceiling;
    this.momX = this.momY = this.momZ = 0;
    this.viewHeight = VIEW_HEIGHT;
    this.viewSpeed = 0;
    return true;
  }

  /** Les grands pas sont coupés en deux ; contre un mur, on glisse le long d'un axe. */
  private moveXY(): void {
    let mx = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, this.momX));
    let my = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, this.momY));
    const steps = Math.abs(mx) > MAX_MOVE / 2 || Math.abs(my) > MAX_MOVE / 2 ? 2 : 1;
    for (let i = 0; i < steps; i++) {
      const nx = this.x + mx / steps;
      const ny = this.y + my / steps;
      if (this.tryMove(nx, ny)) continue;
      if (mx && this.tryMove(nx, this.y)) {
        this.momY = my = 0;
        continue;
      }
      if (my && this.tryMove(this.x, ny)) {
        this.momX = mx = 0;
        continue;
      }
      this.momX = this.momY = 0;
      break;
    }
  }

  private tryMove(nx: number, ny: number): boolean {
    const room = roomAt(this.level, this.obstacles, { fromX: this.x, fromY: this.y, toX: nx, toY: ny, z: this.z, teleport: false });
    if (!room) return false;
    this.x = nx;
    this.y = ny;
    this.floorZ = room.floor;
    this.ceilingZ = room.ceiling;
    return true;
  }

  private moveZ(): void {
    if (this.z < this.floorZ) {
      // Une marche montée : les pieds s'y posent, les yeux suivent en douceur.
      this.viewHeight -= this.floorZ - this.z;
      this.viewSpeed = (VIEW_HEIGHT - this.viewHeight) / 8;
      this.z = this.floorZ;
      this.momZ = 0;
    } else if (this.z > this.floorZ) {
      this.momZ -= this.momZ === 0 ? GRAVITY * 2 : GRAVITY;
      this.z += this.momZ;
      if (this.z <= this.floorZ) {
        // L'atterrissage fait fléchir un peu la vue.
        if (this.momZ < -8) this.viewSpeed = this.momZ / 8;
        this.z = this.floorZ;
        this.momZ = 0;
      }
    }
    if (this.viewSpeed || this.viewHeight < VIEW_HEIGHT) {
      this.viewHeight += this.viewSpeed;
      this.viewSpeed += 0.25;
      if (this.viewHeight >= VIEW_HEIGHT) {
        this.viewHeight = VIEW_HEIGHT;
        this.viewSpeed = 0;
      }
      if (this.viewHeight < VIEW_HEIGHT / 2) this.viewHeight = VIEW_HEIGHT / 2;
    }
  }
}
