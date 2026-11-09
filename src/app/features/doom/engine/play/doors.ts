import { Level, Line, Sector } from '../level/level.model';
import { DOOR_SPEED, DOOR_WAIT, PLAYER_RADIUS, USE_RANGE } from './physics';

/*
 * Les portes (p_doors). Une porte de Doom ne pivote pas et ne glisse pas : c'est un secteur dont le
 * plafond, posé sur le sol, monte puis redescend. L'arbre BSP est calculé une fois pour toutes
 * avant de jouer : il fixe le plan, mais pas les hauteurs, et rien n'oblige à le refaire.
 */

type Phase = 'closed' | 'opening' | 'open' | 'closing';

interface Door {
  readonly sector: Sector;
  /** Hauteur du plafond une fois ouverte : 4 sous le plus bas des plafonds voisins, comme dans Doom. */
  readonly top: number;
  phase: Phase;
  wait: number;
}

function touchesDoor(line: Line, sector: Sector): boolean {
  return line.front.sector === sector || line.back?.sector === sector;
}

function topOf(level: Level, sector: Sector): number {
  let lowest = Infinity;
  for (const line of level.lines) {
    if (!line.back || !touchesDoor(line, sector)) continue;
    const other = line.front.sector === sector ? line.back.sector : line.front.sector;
    lowest = Math.min(lowest, other.ceiling);
  }
  return lowest - 4;
}

function segmentsCross(ax: number, ay: number, bx: number, by: number, line: Line): number | null {
  const ex = line.v2.x - line.v1.x;
  const ey = line.v2.y - line.v1.y;
  const d = (bx - ax) * ey - (by - ay) * ex;
  if (d === 0) return null;
  const t = ((line.v1.x - ax) * ey - (line.v1.y - ay) * ex) / d;
  const u = ((line.v1.x - ax) * (by - ay) - (line.v1.y - ay) * (bx - ax)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

/** Le joueur, avec son rayon, est-il sous la porte ? */
function under(sector: Sector, x: number, y: number): boolean {
  const points = sector.loops[0];
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const r = PLAYER_RADIUS;
  return x > Math.min(...xs) - r && x < Math.max(...xs) + r && y > Math.min(...ys) - r && y < Math.max(...ys) + r;
}

/** Toutes les portes du niveau, mises à jour tic par tic. */
export class Doors {
  private readonly doors: Door[];

  constructor(private readonly level: Level) {
    // Le niveau est partagé entre les visites de la page : on repart portes fermées.
    for (const sector of level.doors) sector.ceiling = sector.floor;
    this.doors = level.doors.map((sector) => ({ sector, top: topOf(level, sector), phase: 'closed', wait: 0 }));
  }

  /** La hauteur du plafond de chaque porte : tout ce qu'une autre fenêtre doit savoir. */
  get heights(): number[] {
    return this.doors.map((d) => d.sector.ceiling);
  }

  /** Le joueur appuie sur « utiliser » : la première porte droit devant lui, à portée de main, s'ouvre ou se ferme. */
  use(x: number, y: number, angle: number): boolean {
    const door = this.doorAhead(x, y, angle);
    if (!door) return false;
    door.phase = door.phase === 'closed' || door.phase === 'closing' ? 'opening' : 'closing';
    return true;
  }

  /** Un tic : renvoie true si un plafond a bougé. */
  tic(playerX: number, playerY: number): boolean {
    let moved = false;
    for (const door of this.doors) {
      const { sector } = door;
      if (door.phase === 'opening') {
        sector.ceiling = Math.min(door.top, sector.ceiling + DOOR_SPEED);
        moved = true;
        if (sector.ceiling === door.top) {
          door.phase = 'open';
          door.wait = DOOR_WAIT;
        }
      } else if (door.phase === 'open') {
        if (--door.wait <= 0) door.phase = 'closing';
      } else if (door.phase === 'closing') {
        // Une porte ne se referme jamais sur le joueur : elle repart vers le haut.
        if (under(sector, playerX, playerY)) {
          door.phase = 'opening';
          continue;
        }
        sector.ceiling = Math.max(sector.floor, sector.ceiling - DOOR_SPEED);
        moved = true;
        if (sector.ceiling === sector.floor) door.phase = 'closed';
      }
    }
    return moved;
  }

  private doorAhead(x: number, y: number, angle: number): Door | null {
    const standingIn = this.doors.find((d) => under(d.sector, x, y) && d.sector.ceiling > d.sector.floor);
    const bx = x + Math.cos(angle) * USE_RANGE;
    const by = y + Math.sin(angle) * USE_RANGE;
    let best: Door | null = null;
    let nearest = Infinity;
    for (const line of this.level.lines) {
      if (!line.back) continue;
      const door = this.doors.find((d) => touchesDoor(line, d.sector));
      if (!door) continue;
      const t = segmentsCross(x, y, bx, by, line);
      if (t !== null && t < nearest) {
        nearest = t;
        best = door;
      }
    }
    return best ?? standingIn ?? null;
  }
}
