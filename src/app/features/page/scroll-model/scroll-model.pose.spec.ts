import { BN_ALIGNED_AT, modelPose } from './scroll-model.pose';

describe('Le monogramme qui suit le défilement', () => {
  const W = 1600;
  const H = 8000;
  const VH = 900;
  const at = (fraction: number) => modelPose(fraction * (H - VH), VH, W, H);

  it('reste caché en haut de page, puis apparaît', () => {
    expect(modelPose(0, VH, W, H).appear).toBe(0);
    expect(modelPose(VH, VH, W, H).appear).toBe(1);
  });

  it('est parfaitement de face à un seul instant', () => {
    const aligned = at(BN_ALIGNED_AT);
    expect(aligned.turn).toBeCloseTo(0);
    expect(aligned.tilt).toBeCloseTo(0);
    expect(aligned.glow).toBe(1);
    expect(at(0.5).glow).toBe(0);
    expect(at(0.5).tilt).not.toBeCloseTo(0);
  });

  it('tient en entier dans la page au moment où il se forme', () => {
    const pose = at(BN_ALIGNED_AT);
    expect(pose.x + pose.side).toBeLessThanOrEqual(W);
  });

  it('donne le même résultat pour le même défilement : la loupe recopie sans rien recevoir de plus', () => {
    expect(modelPose(1234, VH, W, H)).toEqual(modelPose(1234, VH, W, H));
  });
});
