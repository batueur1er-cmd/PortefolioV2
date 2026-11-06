import { Sector } from '../level/level.model';

/** Les lumières qui vacillent suivent une suite fixe : la même image dans toutes les fenêtres. */
const FLICKER = Array.from({ length: 64 }, (_, i) => Math.imul(i + 7, 2654435761) >>> 24 < 190);

/** La lumière d'un secteur à un instant donné (en tics), de 0 à 255. */
export function sectorLight(sector: Sector, tic: number): number {
  if (sector.dimLight === null) return sector.light;
  return FLICKER[Math.floor(tic / 4) % FLICKER.length] ? sector.light : sector.dimLight;
}
