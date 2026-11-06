import { DoomPresence } from '@core/sync/window-bus';

import { degrees, heading, phaseOf, sameDoom } from './doom-state';

describe('L’état de la démo façon Doom', () => {
  it('donne la direction du regard en clair', () => {
    expect(heading(0)).toBe('l’est');
    expect(heading(Math.PI / 4)).toBe('le nord-est');
    expect(heading(-Math.PI / 2)).toBe('le sud');
    expect(heading(2 * Math.PI + 0.1)).toBe('l’est');
    expect(degrees(-Math.PI / 2)).toBe(270);
  });

  it('situe le rendu au ralenti : murs, puis sols, puis objets', () => {
    const stats = { wallOps: 100, planeOps: 50, ops: 170 };
    expect(phaseOf(stats, 0)).toBe('murs');
    expect(phaseOf(stats, 120)).toBe('sols');
    expect(phaseOf(stats, 160)).toBe('objets');
    expect(phaseOf(stats, 170)).toBe('fini');
  });

  it('reconnaît deux états qui donnent la même image', () => {
    const a: DoomPresence = { x: 1, y: 2, z: 41, angle: 0.5, fov: 90, tic: 3, replay: null, bsp: false };
    expect(sameDoom(a, { ...a })).toBe(true);
    expect(sameDoom(a, { ...a, tic: 4 })).toBe(false);
    expect(sameDoom(a, { ...a, replay: { done: 0, total: 10, playing: true } })).toBe(false);
    expect(sameDoom(a, null)).toBe(false);
  });
});
