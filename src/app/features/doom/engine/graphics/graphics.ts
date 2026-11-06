import { buildFlats } from './flats';
import { Graphics } from './graphics.model';
import { buildSky } from './sky';
import { buildSprites } from './sprites';
import { buildWalls } from './walls';

/** Toutes les images du niveau, dessinées une fois au chargement. */
export function buildGraphics(): Graphics {
  return { walls: buildWalls(), flats: buildFlats(), sky: buildSky(), sprites: buildSprites() };
}
