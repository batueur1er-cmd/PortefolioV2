/* Géométrie partagée par les deux loupes. Tout est en pixels CSS. */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly w: number;
  readonly h: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface WindowMetrics {
  readonly screenX: number;
  readonly screenY: number;
  readonly outerWidth: number;
  readonly outerHeight: number;
  readonly innerWidth: number;
  readonly innerHeight: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

export const area = (r: Rect): number => Math.max(0, r.w) * Math.max(0, r.h);

export function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

export function overlapArea(a: Rect, b: Rect): number {
  const inter = intersect(a, b);
  return inter ? area(inter) : 0;
}

/**
 * Part visible d'un secret dans une zone, rapportée à la plus petite des deux surfaces :
 * un petit secret doit être presque entièrement dans la loupe, un grand compte dès qu'il la remplit.
 */
export function coverage(target: Rect, zone: Rect): number {
  const ref = Math.min(area(target), area(zone));
  return ref > 0 ? overlapArea(target, zone) / ref : 0;
}

/** Même mesure pour la loupe circulaire, par échantillonnage d'une grille de points. */
export function circleCoverage(target: Rect, center: Point, radius: number, steps = 7): number {
  const targetArea = area(target);
  if (targetArea <= 0 || radius <= 0) return 0;
  const zone = intersect(target, {
    x: center.x - radius,
    y: center.y - radius,
    w: radius * 2,
    h: radius * 2,
  });
  if (!zone) return 0;
  const r2 = radius * radius;
  let inside = 0;
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < steps; j++) {
      const dx = zone.x + ((i + 0.5) / steps) * zone.w - center.x;
      const dy = zone.y + ((j + 0.5) / steps) * zone.h - center.y;
      if (dx * dx + dy * dy <= r2) inside++;
    }
  }
  const covered = (inside / (steps * steps)) * area(zone);
  return covered / Math.min(targetArea, Math.PI * r2);
}

export function distanceToRect(p: Point, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

export const fromDomRect = (r: DOMRectReadOnly): Rect => ({
  x: r.left,
  y: r.top,
  w: r.width,
  h: r.height,
});

/** Coin haut-gauche de la zone de contenu, en pixels écran (bordures et barres du navigateur déduites). */
export function contentOrigin(w: WindowMetrics): Point {
  const border = Math.max(0, (w.outerWidth - w.innerWidth) / 2);
  const top = Math.max(0, w.outerHeight - w.innerHeight - border);
  return { x: w.screenX + border, y: w.screenY + top };
}

/**
 * Transformation CSS qui pose la page du portfolio sous la loupe : décalage de l'écart entre
 * les deux fenêtres (défilement compris), puis zoom centré sur `pivot`.
 */
export function lensTransform(offset: Point, pivot: Point, zoom: number): string {
  return (
    `translate(${pivot.x}px, ${pivot.y}px) scale(${zoom}) ` +
    `translate(${offset.x - pivot.x}px, ${offset.y - pivot.y}px)`
  );
}
