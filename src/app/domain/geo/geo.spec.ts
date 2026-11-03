import { haversineKm, projectToBox } from './geo';

describe('geo', () => {
  it('calcule une distance à vol d’oiseau', () => {
    const paris = { lat: 48.8566, lon: 2.3522 };
    const lyon = { lat: 45.764, lon: 4.8357 };
    expect(haversineKm(paris, lyon)).toBeGreaterThan(385);
    expect(haversineKm(paris, lyon)).toBeLessThan(400);
  });

  it('projette les points dans le cadre, nord en haut', () => {
    const north = { lat: 46.1, lon: 4.75 };
    const south = { lat: 45.6, lon: 5.15 };
    const [n, s] = projectToBox([north, south], { w: 300, h: 200 }, 20);
    for (const p of [n, s]) {
      expect(p.x).toBeGreaterThanOrEqual(20);
      expect(p.x).toBeLessThanOrEqual(280);
      expect(p.y).toBeGreaterThanOrEqual(20);
      expect(p.y).toBeLessThanOrEqual(180);
    }
    expect(n.y).toBeLessThan(s.y);
    expect(n.x).toBeLessThan(s.x);
  });
});
