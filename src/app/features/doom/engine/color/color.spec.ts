import { MAX_LIGHT_SCALE, MAX_LIGHT_Z, buildLightTables } from './light-tables';
import { COLORMAPS, RAMP_COLORS, buildPalette, parseColor } from './palette';

describe('La palette et la lumière', () => {
  it('reprend les formules de lumière de Doom', () => {
    const lights = buildLightTables();
    // Un secteur en pleine lumière ne s'assombrit jamais.
    for (let j = 0; j < MAX_LIGHT_SCALE; j++) expect(lights.scale[15 * MAX_LIGHT_SCALE + j]).toBe(0);
    // Un secteur sombre au loin : la table la plus sombre ; de près, on remonte.
    expect(lights.scale[4 * MAX_LIGHT_SCALE]).toBe(COLORMAPS - 1);
    expect(lights.scale[8 * MAX_LIGHT_SCALE + 47]).toBe(5);
    // Les sols : clairs juste devant, plus sombres au loin.
    expect(lights.z[8 * MAX_LIGHT_Z]).toBe(0);
    expect(lights.z[8 * MAX_LIGHT_Z + 127]).toBe(28);
  });

  it('garde la table 0 telle quelle et assombrit les suivantes', () => {
    const palette = buildPalette(RAMP_COLORS.map(([, fallback]) => parseColor(fallback, fallback)));
    for (let i = 0; i < 256; i++) expect(palette.colormaps[i]).toBe(i);
    const mean = (level: number) => {
      let sum = 0;
      for (let i = 0; i < 256; i++) sum += palette.lum[palette.colormaps[level * 256 + i]];
      return sum / 256;
    };
    expect(mean(16)).toBeLessThan(mean(0));
    expect(mean(31)).toBeLessThan(mean(16));
  });

  it('lit les couleurs du thème', () => {
    expect(parseColor('#4f46e5', '#000')).toEqual([79, 70, 229]);
    expect(parseColor(' #fff ', '#000')).toEqual([255, 255, 255]);
    expect(parseColor('rgb(1, 2, 3)', '#000')).toEqual([1, 2, 3]);
    expect(parseColor('', '#818cf8')).toEqual([129, 140, 248]);
  });
});
