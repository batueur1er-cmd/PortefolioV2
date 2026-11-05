import { formatElapsed, maskLabel } from './hunt-clock';

describe('chronomètre de la chasse', () => {
  it('formate les durées', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(134_000)).toBe('02:14');
    expect(formatElapsed(3_734_000)).toBe('1:02:14');
  });

  it('masque une lettre sur deux, sauf les mots courts', () => {
    expect(maskLabel('Le graphe des compétences')).toBe('Le g_a_h_ d_s c_m_é_e_c_s');
  });
});
