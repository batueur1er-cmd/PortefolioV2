import { BN_ALIGNED_AT, modelPose, parseForm } from './scroll-model.pose';

describe('La forme qui suit le défilement', () => {
  const W = 1600;
  const H = 8000;
  const VH = 900;
  const at = (form: 'bn' | 'constellation', fraction: number) => modelPose(form, fraction * (H - VH), VH, W, H);

  it('reste cachée en haut de page, puis apparaît', () => {
    expect(modelPose('bn', 0, VH, W, H).appear).toBe(0);
    expect(modelPose('constellation', VH, VH, W, H).appear).toBe(1);
  });

  it('ne reconnaît que les deux formes prévues', () => {
    expect(parseForm('bn')).toBe('bn');
    expect(parseForm('autre')).toBeNull();
    expect(parseForm(null)).toBeNull();
  });

  it('constellation : reste au bord et fait un seul tour', () => {
    expect(at('constellation', 0).x).toBe(at('constellation', 0.5).x);
    expect(at('constellation', 0).x).toBeGreaterThan(W * 0.75);
    expect(at('constellation', 1).turn - at('constellation', 0).turn).toBeCloseTo(2 * Math.PI);
  });

  it('monogramme : parfaitement de face à un seul instant', () => {
    const aligned = at('bn', BN_ALIGNED_AT);
    expect(aligned.turn).toBeCloseTo(0);
    expect(aligned.tilt).toBeCloseTo(0);
    expect(aligned.glow).toBe(1);
    expect(at('bn', 0.5).glow).toBe(0);
    expect(at('bn', 0.5).tilt).not.toBeCloseTo(0);
  });

  it('monogramme : tient en entier dans la page', () => {
    const pose = at('bn', BN_ALIGNED_AT);
    expect(pose.x + pose.side).toBeLessThanOrEqual(W);
  });

  it('donne le même résultat pour le même défilement : la loupe recopie sans rien recevoir de plus', () => {
    expect(modelPose('bn', 1234, VH, W, H)).toEqual(modelPose('bn', 1234, VH, W, H));
  });
});
