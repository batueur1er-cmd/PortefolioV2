import { modelPose } from './scroll-model.pose';

describe('L’objet 3D qui suit le défilement', () => {
  const W = 1600;
  const H = 8000;
  const VH = 900;
  const at = (fraction: number) => modelPose(fraction * (H - VH), VH, W, H);

  it('reste caché en haut de page, puis apparaît', () => {
    expect(modelPose(0, VH, W, H).appear).toBe(0);
    expect(modelPose(VH, VH, W, H).appear).toBe(1);
  });

  it('s’ouvre au milieu de la descente et se referme à la fin', () => {
    expect(at(0.1).explode).toBe(0);
    expect(at(0.6).explode).toBe(1);
    expect(at(1).explode).toBe(0);
  });

  it('traverse la page d’un bord à l’autre', () => {
    expect(at(0).x).toBeGreaterThan(W * 0.5);
    expect(at(1 / 3).x).toBeLessThan(W * 0.1);
  });

  it('donne le même résultat pour le même défilement : la loupe recopie sans rien recevoir de plus', () => {
    expect(modelPose(1234, VH, W, H)).toEqual(modelPose(1234, VH, W, H));
  });

  it('borne le défilement au-delà de la page', () => {
    expect(modelPose(H * 2, VH, W, H).explode).toBe(0);
  });
});
