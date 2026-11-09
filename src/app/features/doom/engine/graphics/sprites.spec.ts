import { Patch } from './graphics.model';
import { buildSprites } from './sprites';

describe('Les sprites', () => {
  const chest = buildSprites().coffre.frames[0];
  const span = (patch: Patch) => {
    const filled = patch.columns.flatMap((posts, x) => (posts.length ? [x] : []));
    return filled[filled.length - 1] - filled[0] + 1;
  };
  const picture = (patch: Patch) => JSON.stringify(patch.columns.map((posts) => posts.map((p) => [p.top, [...p.pixels]])));

  it('dessine le coffre sous 8 angles', () => {
    expect(chest.length).toBe(8);
    expect(new Set(chest.map(picture)).size).toBeGreaterThanOrEqual(6);
  });

  it('montre le coffre large de face, étroit de côté, et plus large encore en biais', () => {
    expect(span(chest[0])).toBe(80);
    expect(span(chest[2])).toBe(48);
    expect(span(chest[1])).toBeGreaterThan(80);
  });

  it('distingue l’avant de l’arrière', () => {
    expect(picture(chest[0])).not.toBe(picture(chest[4]));
  });
});
