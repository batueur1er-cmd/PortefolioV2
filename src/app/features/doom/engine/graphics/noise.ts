/** Un bruit déterministe entre 0 et 1 : les mêmes images dans toutes les fenêtres, sans Math.random. */
export function hash(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 1 pour une proportion `rate` des pixels, 0 sinon : un grain léger. */
export const grain = (x: number, y: number, seed: number, rate: number): number => (hash(x, y, seed) < rate ? 1 : 0);
