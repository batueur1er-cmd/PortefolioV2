import { Point, Size } from './geometry';

export interface GeoPoint {
  readonly lat: number;
  readonly lon: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Distance à vol d'oiseau entre deux points GPS. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Projette des points GPS dans un cadre en gardant les proportions
 * (projection équirectangulaire locale, largement suffisante à l'échelle d'une région).
 */
export function projectToBox(points: readonly GeoPoint[], box: Size, padding = 0): Point[] {
  if (!points.length) return [];
  const meanLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const k = Math.cos(toRad(meanLat));
  const xs = points.map((p) => p.lon * k);
  const ys = points.map((p) => -p.lat);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(Math.max(...xs) - minX, 1e-9);
  const spanY = Math.max(Math.max(...ys) - minY, 1e-9);
  const scale = Math.min((box.w - 2 * padding) / spanX, (box.h - 2 * padding) / spanY);
  const offX = (box.w - spanX * scale) / 2;
  const offY = (box.h - spanY * scale) / 2;
  return points.map((_, i) => ({ x: offX + (xs[i] - minX) * scale, y: offY + (ys[i] - minY) * scale }));
}
