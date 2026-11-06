import {
  DEFAULT_LIGHT,
  DEFAULT_TRANSFORM,
  LIGHT_SLIDERS,
  TRANSFORM_SLIDERS,
  clampSlider,
  demoIdOf,
  demoKey,
  framing,
  lightDirection,
  roundCamera,
  sameSettings,
} from './viewer-state';

const length = (v: readonly number[]): number => Math.hypot(...v);

describe('état du visualiseur 3D', () => {
  it('place la lumière d’après son azimut et sa hauteur', () => {
    const zenith = lightDirection(0, 90);
    expect(zenith[1]).toBeCloseTo(1);
    const east = lightDirection(90, 0);
    expect(east[0]).toBeCloseTo(1);
    expect(east[1]).toBeCloseTo(0);
    expect(length(lightDirection(37, 52))).toBeCloseTo(1);
  });

  it('garde les réglages dans les bornes de leur curseur', () => {
    const intensity = LIGHT_SLIDERS.find((s) => s.key === 'intensity')!;
    expect(clampSlider(intensity, 99)).toBe(intensity.max);
    expect(clampSlider(intensity, -1)).toBe(intensity.min);
    expect(clampSlider(intensity, Number.NaN)).toBe(intensity.min);
    expect(clampSlider(intensity, 1.5)).toBe(1.5);
  });

  it('a des valeurs par défaut que ses propres curseurs acceptent', () => {
    for (const s of LIGHT_SLIDERS) expect(clampSlider(s, DEFAULT_LIGHT[s.key])).toBe(DEFAULT_LIGHT[s.key]);
    for (const s of TRANSFORM_SLIDERS) {
      expect(clampSlider(s, DEFAULT_TRANSFORM[s.key])).toBe(DEFAULT_TRANSFORM[s.key]);
    }
  });

  it('affiche les valeurs à la française', () => {
    const scale = TRANSFORM_SLIDERS.find((s) => s.key === 'scale')!;
    expect(scale.format(1.25)).toBe('×1,25');
    expect(LIGHT_SLIDERS.find((s) => s.key === 'azimuth')!.format(40.4)).toBe('40°');
  });

  it('arrondit la caméra, pour ne pas renvoyer un état qui ne bouge plus', () => {
    const camera = roundCamera([1.234567, 2, 3], [0, 0.000049, 0]);
    expect(camera.position[0]).toBe(1.2346);
    expect(camera.target[1]).toBe(0);
  });

  it('cadre le modèle d’un peu haut, et de plus loin quand il est plus grand', () => {
    const small = framing(1, 1);
    const large = framing(1, 2);
    expect(small.target).toEqual([0, 0.5, 0]);
    expect(small.position[1]).toBeGreaterThan(small.target[1]);
    const distance = (c: typeof small) =>
      Math.hypot(c.position[0] - c.target[0], c.position[1] - c.target[1], c.position[2] - c.target[2]);
    expect(distance(large)).toBeGreaterThan(distance(small) * 1.9);
  });

  it('distingue les modèles d’exemple des fichiers importés', () => {
    expect(demoIdOf(demoKey('colis'))).toBe('colis');
    expect(demoIdOf('file:1a2b3c4d')).toBeNull();
  });

  it('compare deux réglages par leur contenu', () => {
    const a = { model: 'demo:colis', modelName: 'Le colis', light: DEFAULT_LIGHT, transform: DEFAULT_TRANSFORM };
    expect(sameSettings(a, { ...a, light: { ...DEFAULT_LIGHT } })).toBe(true);
    expect(sameSettings(a, { ...a, light: { ...DEFAULT_LIGHT, intensity: 1 } })).toBe(false);
    expect(sameSettings(a, null)).toBe(false);
  });
});
