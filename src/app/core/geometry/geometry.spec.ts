import {
  circleCoverage,
  contentOrigin,
  coverage,
  distanceToRect,
  intersect,
  lensTransform,
  overlapArea,
  pageZoom,
} from './geometry';

describe('zoom du navigateur', () => {
  const win = (outerWidth: number, innerWidth: number) => ({
    screenX: 0,
    screenY: 0,
    outerWidth,
    outerHeight: 900,
    innerWidth,
    innerHeight: 780,
  });

  it('retrouve le niveau de zoom malgré la bordure de fenêtre', () => {
    expect(pageZoom(win(1216, 1200))).toBe(1);
    expect(pageZoom(win(1336, 1200))).toBe(1.1);
    expect(pageZoom(win(1216, 1351))).toBe(0.9);
  });

  it('calcule le coin du contenu en pixels écran avec un zoom', () => {
    // Zoom 110 % : 1200 px CSS occupent 1320 px écran, bordure de 8 px de chaque côté.
    expect(contentOrigin({ ...win(1336, 1200), screenX: 100, screenY: 50 }, 1.1).x).toBe(108);
  });
});

describe('geometry', () => {
  it('intersecte deux rectangles', () => {
    expect(intersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toEqual({ x: 5, y: 5, w: 5, h: 5 });
    expect(intersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 5, h: 5 })).toBeNull();
    expect(overlapArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 0, w: 10, h: 10 })).toBe(50);
  });

  it('rapporte la couverture à la plus petite surface', () => {
    const lens = { x: 0, y: 0, w: 100, h: 100 };
    // Petit secret entièrement dans la loupe.
    expect(coverage({ x: 10, y: 10, w: 20, h: 20 }, lens)).toBe(1);
    // Grand secret qui remplit toute la loupe.
    expect(coverage({ x: -50, y: -50, w: 400, h: 400 }, lens)).toBe(1);
    // Petit secret à moitié dehors.
    expect(coverage({ x: 90, y: 0, w: 20, h: 20 }, lens)).toBeCloseTo(0.5);
  });

  it('mesure la couverture par une loupe circulaire', () => {
    expect(circleCoverage({ x: -10, y: -10, w: 20, h: 20 }, { x: 0, y: 0 }, 100)).toBeCloseTo(1);
    expect(circleCoverage({ x: 500, y: 500, w: 20, h: 20 }, { x: 0, y: 0 }, 100)).toBe(0);
    // Un secret plus grand que la loupe compte dès que la loupe est entièrement dessus.
    expect(circleCoverage({ x: -500, y: -500, w: 1000, h: 1000 }, { x: 0, y: 0 }, 100)).toBeGreaterThan(0.95);
  });

  it('calcule la distance à un rectangle', () => {
    const r = { x: 0, y: 0, w: 10, h: 10 };
    expect(distanceToRect({ x: 5, y: 5 }, r)).toBe(0);
    expect(distanceToRect({ x: 13, y: 14 }, r)).toBe(5);
  });

  it("retrouve l'origine du contenu sous les barres du navigateur", () => {
    const origin = contentOrigin({
      screenX: 100,
      screenY: 50,
      outerWidth: 1216,
      outerHeight: 900,
      innerWidth: 1200,
      innerHeight: 780,
    });
    expect(origin).toEqual({ x: 108, y: 162 });
  });

  it('compose le décalage et le zoom de la loupe', () => {
    expect(lensTransform({ x: -40, y: -300 }, { x: 200, y: 150 }, 1)).toBe(
      'translate(200px, 150px) scale(1) translate(-240px, -450px)',
    );
  });
});
