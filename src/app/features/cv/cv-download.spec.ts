import { jsPDF } from 'jspdf';

import { cvContent } from '@domain/profile/cv';
import { PROFILE } from '@domain/profile/profile.data';

import { renderCv } from './cv-download';

describe('renderCv', () => {
  it('produit un PDF A4 qui contient le nom, les expériences et la formation', () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: false });
    renderCv(pdf, cvContent(PROFILE, new Date(2026, 10, 5)), {
      accent: '#4f46e5',
      ink: '#111827',
      muted: '#4b5563',
      light: '#eef2ff',
    });
    const raw = pdf.output();
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(raw).toContain('Baptiste');
    expect(raw).toContain('EXP');
    expect(raw).toContain(PROFILE.experiences[0].company);
    expect(raw).toContain('FORMATION');
  });
});
