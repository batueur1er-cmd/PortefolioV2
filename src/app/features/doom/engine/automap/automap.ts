import { Level, Seg, Sector } from '../level/level.model';
import { FrameTrace, SCREEN_W, focalOf } from '../render/render.model';

/*
 * La carte vue de dessus (am_map), comme l'automap de Doom : les lignes du niveau, les objets et le joueur
 * avec son champ de vision. Pendant le rendu au ralenti, elle montre ce que le moteur traite :
 * les zones déjà parcourues, le mur en cours et le rayon de sa colonne.
 */

export interface MapColors {
  readonly floor: string;
  readonly wall: string;
  readonly step: string;
  readonly soft: string;
  readonly thing: string;
  readonly player: string;
  readonly fov: string;
  readonly visit: string;
  readonly current: string;
  readonly bsp: string;
  readonly text: string;
  /** L'objet caché dans un mur (rayons X seulement). */
  readonly secret: string;
}

export interface MapScene {
  readonly level: Level;
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  /** Champ de vision, en degrés : l'ouverture du cône du joueur. */
  readonly fov: number;
  readonly colors: MapColors;
  /** Les découpes de l'arbre BSP. */
  readonly bsp: boolean;
  /** Le rang de passage de chaque zone. */
  readonly numbers: boolean;
  /** Les objets cachés dans les murs. */
  readonly hidden: boolean;
  /** Le déroulé de l'image, et où en est son dessin (Infinity : terminée). */
  readonly trace: FrameTrace | null;
  readonly budget: number;
  readonly wallOps: number;
}

/** Comment la carte tient dans le canvas : échelle et origine (l'axe y monte, à l'inverse de l'écran). */
export interface MapFrame {
  readonly scale: number;
  readonly ox: number;
  readonly oy: number;
}

const MARGIN = 40;

export function mapFrame(level: Level, width: number, height: number): MapFrame {
  const b = level.bounds;
  const w = b.maxX - b.minX + MARGIN * 2;
  const h = b.maxY - b.minY + MARGIN * 2;
  const scale = Math.min(width / w, height / h);
  return {
    scale,
    ox: (width - w * scale) / 2 - (b.minX - MARGIN) * scale,
    oy: (height - h * scale) / 2 + (b.maxY + MARGIN) * scale,
  };
}

/** Un point du canvas, en coordonnées du niveau. */
export function mapToWorld(frame: MapFrame, px: number, py: number): { x: number; y: number } {
  return { x: (px - frame.ox) / frame.scale, y: (frame.oy - py) / frame.scale };
}

function traceSector(ctx: CanvasRenderingContext2D, f: MapFrame, sector: Sector): void {
  for (const loop of sector.loops) {
    loop.forEach((v, i) => (i ? ctx.lineTo(f.ox + v.x * f.scale, f.oy - v.y * f.scale) : ctx.moveTo(f.ox + v.x * f.scale, f.oy - v.y * f.scale)));
    ctx.closePath();
  }
}

/** Le milieu d'une zone : la moyenne des milieux de ses segs. */
function centerOf(segs: readonly Seg[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const s of segs) {
    x += (s.v1.x + s.v2.x) / 2;
    y += (s.v1.y + s.v2.y) / 2;
  }
  return { x: x / segs.length, y: y / segs.length };
}

/** L'objet caché : un point vif, un cercle en pointillés et son nom. */
function drawSecret(ctx: CanvasRenderingContext2D, x: number, y: number, ratio: number, colors: MapColors): void {
  ctx.save();
  ctx.fillStyle = colors.secret;
  ctx.strokeStyle = colors.secret;
  ctx.beginPath();
  ctx.arc(x, y, 3.5 * ratio, 0, Math.PI * 2);
  ctx.fill();
  ctx.setLineDash([3 * ratio, 3 * ratio]);
  ctx.lineWidth = 1.5 * ratio;
  ctx.beginPath();
  ctx.arc(x, y, 9 * ratio, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = Math.round(9 * ratio) + 'px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('coffre caché', x + 13 * ratio, y);
  ctx.restore();
}

/** Dessine la carte ; `ratio` : pixels du canvas par pixel CSS, pour garder des traits fins. */
export function drawMap(ctx: CanvasRenderingContext2D, width: number, height: number, ratio: number, scene: MapScene): void {
  const { level, colors, trace, budget } = scene;
  const f = mapFrame(level, width, height);
  const X = (x: number) => f.ox + x * f.scale;
  const Y = (y: number) => f.oy - y * f.scale;
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Les sols, puis ce que le rendu a déjà parcouru (borné aux secteurs).
  ctx.save();
  ctx.beginPath();
  for (const sector of level.sectors) traceSector(ctx, f, sector);
  ctx.fillStyle = colors.floor;
  ctx.fill('nonzero');
  ctx.clip('nonzero');
  if (trace) {
    const visits = trace.visits.filter((v) => v.op <= budget);
    visits.forEach((visit, n) => {
      const cell = level.subsectors[visit.subsector].cell;
      ctx.beginPath();
      cell.forEach((v, i) => (i ? ctx.lineTo(X(v.x), Y(v.y)) : ctx.moveTo(X(v.x), Y(v.y))));
      ctx.closePath();
      ctx.fillStyle = n === visits.length - 1 && budget < scene.wallOps ? colors.current : colors.visit;
      ctx.fill();
    });
    const plane = trace.planes.find((p) => budget >= p.op0 && budget < p.op1);
    if (plane) {
      ctx.beginPath();
      for (const sector of plane.sectors) traceSector(ctx, f, sector);
      ctx.fillStyle = colors.current;
      ctx.fill('nonzero');
    }
  }
  ctx.restore();

  // Les découpes de l'arbre BSP : les premières en traits plus épais.
  if (scene.bsp) {
    ctx.save();
    ctx.setLineDash([4 * ratio, 4 * ratio]);
    ctx.strokeStyle = colors.bsp;
    for (const node of level.nodes) {
      ctx.globalAlpha = Math.max(0.35, 1 - node.depth * 0.08);
      ctx.lineWidth = Math.max(0.75, 2 - node.depth * 0.15) * ratio;
      ctx.beginPath();
      ctx.moveTo(X(node.cut[0].x), Y(node.cut[0].y));
      ctx.lineTo(X(node.cut[1].x), Y(node.cut[1].y));
      ctx.stroke();
    }
    ctx.restore();
  }

  // Les lignes : murs pleins, marches, linteaux. Les lignes invisibles ne sont pas tracées.
  for (const line of level.lines) {
    const back = line.back?.sector;
    const front = line.front.sector;
    const door = back && (front.door || back.door);
    const style = !back ? 'wall' : door ? 'door' : back.floor !== front.floor ? 'step' : back.ceiling !== front.ceiling ? 'soft' : null;
    if (!style) continue;
    ctx.strokeStyle = style === 'wall' ? colors.wall : style === 'door' ? colors.thing : style === 'step' ? colors.step : colors.soft;
    ctx.lineWidth = (style === 'wall' || style === 'door' ? 2 : 1.25) * ratio;
    ctx.beginPath();
    ctx.moveTo(X(line.v1.x), Y(line.v1.y));
    ctx.lineTo(X(line.v2.x), Y(line.v2.y));
    ctx.stroke();
  }

  // Le mur en cours de dessin, et le rayon de sa colonne.
  const wall = trace && budget < scene.wallOps ? [...trace.walls].reverse().find((w) => w.op <= budget) : undefined;
  if (wall) {
    const { seg } = wall;
    ctx.strokeStyle = colors.current;
    ctx.lineWidth = 4 * ratio;
    ctx.beginPath();
    ctx.moveTo(X(seg.v1.x), Y(seg.v1.y));
    ctx.lineTo(X(seg.v2.x), Y(seg.v2.y));
    ctx.stroke();
    const column = Math.min(wall.x2, wall.x1 + Math.floor(budget - wall.op));
    const a = scene.angle + Math.atan((SCREEN_W / 2 - column - 0.5) / focalOf(scene.fov));
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const ex = seg.v2.x - seg.v1.x;
    const ey = seg.v2.y - seg.v1.y;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) > 1e-9) {
      const t = ((seg.v1.x - scene.x) * ey - (seg.v1.y - scene.y) * ex) / den;
      ctx.lineWidth = 1.5 * ratio;
      ctx.beginPath();
      ctx.moveTo(X(scene.x), Y(scene.y));
      ctx.lineTo(X(scene.x + dx * t), Y(scene.y + dy * t));
      ctx.stroke();
    }
  }

  // Le rang de passage des zones : du plus proche au plus lointain.
  if (scene.numbers && trace) {
    ctx.fillStyle = colors.text;
    ctx.font = `${Math.round(9 * ratio)}px ui-monospace, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    trace.visits
      .filter((v) => v.op <= budget)
      .forEach((visit, n) => {
        const c = centerOf(level.subsectors[visit.subsector].segs);
        ctx.fillText(String(n + 1), X(c.x), Y(c.y));
      });
  }

  // Les objets, puis le joueur et son champ de vision de 90°.
  const sprite = trace?.sprites.find((s) => budget >= s.op0 && budget < s.op1);
  for (const thing of level.things) {
    if (thing.hidden) {
      if (scene.hidden) drawSecret(ctx, X(thing.x), Y(thing.y), ratio, colors);
      continue;
    }
    ctx.fillStyle = colors.thing;
    ctx.beginPath();
    ctx.arc(X(thing.x), Y(thing.y), Math.max(2.5 * ratio, 12 * f.scale), 0, Math.PI * 2);
    ctx.fill();
    if (sprite?.thing === thing) {
      ctx.strokeStyle = colors.current;
      ctx.lineWidth = 2.5 * ratio;
      ctx.beginPath();
      ctx.arc(X(thing.x), Y(thing.y), Math.max(7 * ratio, 30 * f.scale), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const reach = 360;
  const px = X(scene.x);
  const py = Y(scene.y);
  ctx.fillStyle = colors.fov;
  ctx.beginPath();
  ctx.moveTo(px, py);
  const half = (scene.fov * Math.PI) / 360;
  ctx.lineTo(X(scene.x + Math.cos(scene.angle + half) * reach), Y(scene.y + Math.sin(scene.angle + half) * reach));
  ctx.lineTo(X(scene.x + Math.cos(scene.angle - half) * reach), Y(scene.y + Math.sin(scene.angle - half) * reach));
  ctx.closePath();
  ctx.fill();
  const size = Math.max(6 * ratio, 28 * f.scale);
  const tip = (a: number, r: number) => [px + Math.cos(a) * r, py - Math.sin(a) * r] as const;
  ctx.fillStyle = colors.player;
  ctx.beginPath();
  ctx.moveTo(...tip(scene.angle, size));
  ctx.lineTo(...tip(scene.angle + 2.5, size * 0.75));
  ctx.lineTo(...tip(scene.angle - 2.5, size * 0.75));
  ctx.closePath();
  ctx.fill();
}
