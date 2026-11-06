import { insideSector, subsectorAt } from '../level/level';
import { Level, Line } from '../level/level.model';
import { MAX_STEP, PLAYER_HEIGHT, PLAYER_RADIUS } from './physics';

/** Un objet qui bloque le passage. */
export interface Obstacle {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/** La place disponible à un endroit : le sol le plus haut et le plafond le plus bas sous le joueur. */
export interface Room {
  readonly floor: number;
  readonly ceiling: number;
}

function distanceToLine(px: number, py: number, line: Line): number {
  const dx = line.v2.x - line.v1.x;
  const dy = line.v2.y - line.v1.y;
  const t = Math.max(0, Math.min(1, ((px - line.v1.x) * dx + (py - line.v1.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (line.v1.x + dx * t), py - (line.v1.y + dy * t));
}

/** Le trajet de (ax, ay) à (bx, by) traverse-t-il la ligne ? (pour ne jamais passer à travers un mur fin) */
function crosses(ax: number, ay: number, bx: number, by: number, line: Line): boolean {
  const ex = line.v2.x - line.v1.x;
  const ey = line.v2.y - line.v1.y;
  const d = (bx - ax) * ey - (by - ay) * ex;
  if (d === 0) return false;
  const t = ((line.v1.x - ax) * ey - (line.v1.y - ay) * ex) / d;
  const u = ((line.v1.x - ax) * (by - ay) - (line.v1.y - ay) * (bx - ax)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export interface Move {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  /** Hauteur des pieds au départ. */
  readonly z: number;
  /** Un saut direct (clic sur la carte) : ni trajet, ni limite de marche. */
  readonly teleport: boolean;
}

/**
 * La place à l'arrivée, comme P_CheckPosition dans Doom : le joueur touche toutes les lignes à
 * moins de son rayon ; un mur plein l'arrête, une ouverture trop basse ou une marche trop haute aussi.
 */
export function roomAt(level: Level, obstacles: readonly Obstacle[], move: Move): Room | null {
  const { fromX, fromY, toX, toY } = move;
  const sector = subsectorAt(level, toX, toY).sector;
  if (!insideSector(sector, toX, toY)) return null;
  let floor = sector.floor;
  let ceiling = sector.ceiling;
  const r = PLAYER_RADIUS;
  for (const line of level.lines) {
    if (Math.max(line.v1.x, line.v2.x) < Math.min(toX, fromX) - r || Math.min(line.v1.x, line.v2.x) > Math.max(toX, fromX) + r) continue;
    if (Math.max(line.v1.y, line.v2.y) < Math.min(toY, fromY) - r || Math.min(line.v1.y, line.v2.y) > Math.max(toY, fromY) + r) continue;
    const touched = distanceToLine(toX, toY, line) < r || (!move.teleport && crosses(fromX, fromY, toX, toY, line));
    if (!touched) continue;
    if (!line.back) return null;
    floor = Math.max(floor, line.front.sector.floor, line.back.sector.floor);
    ceiling = Math.min(ceiling, line.front.sector.ceiling, line.back.sector.ceiling);
  }
  if (ceiling - floor < PLAYER_HEIGHT) return null;
  if (!move.teleport && (ceiling - move.z < PLAYER_HEIGHT || floor - move.z > MAX_STEP)) return null;
  for (const o of obstacles) {
    const reach = r + o.radius;
    const inside = Math.hypot(toX - o.x, toY - o.y) < reach;
    // Déjà collé à l'objet : on peut toujours s'en éloigner.
    if (inside && (move.teleport || Math.hypot(fromX - o.x, fromY - o.y) >= reach - 0.01)) return null;
  }
  return { floor, ceiling };
}
