import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { jsPDF } from 'jspdf';

import { TODAY } from '@core/time/time';
import { CvContent, CvEntry, cvContent } from '@domain/profile/cv';
import { PROFILE } from '@domain/profile/profile.data';

import { AchievementsStore } from '@features/achievements/data/achievements.store';

/* Mise en page A4, en millimètres. */
const PAGE_W = 210;
const PAGE_H = 297;
const SIDE_W = 64;
const MARGIN = 12;
const MAIN_X = SIDE_W + 10;
const MAIN_W = PAGE_W - MAIN_X - MARGIN;
const BOTTOM = PAGE_H - 14;

export interface Palette {
  readonly accent: string;
  readonly ink: string;
  readonly muted: string;
  readonly light: string;
}

/**
 * Le CV en PDF, généré à la demande dans le navigateur à partir de `profile.data.ts`. La
 * bibliothèque n'est chargée qu'au clic, pour ne rien coûter à l'ouverture du site.
 */
@Injectable({ providedIn: 'root' })
export class CvDownload {
  private readonly doc = inject(DOCUMENT);
  private readonly today = inject(TODAY);
  private readonly achievements = inject(AchievementsStore);
  readonly busy = signal(false);

  async download(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const content = cvContent(PROFILE, this.today);
      renderCv(pdf, content, this.palette());
      pdf.save(content.fileName);
      this.achievements.unlock('cv');
    } finally {
      this.busy.set(false);
    }
  }

  /** Les couleurs du thème clair du site, lues sur la page (repli sur l'indigo d'origine). */
  private palette(): Palette {
    const style = this.doc.defaultView?.getComputedStyle(this.doc.documentElement);
    const read = (name: string, fallback: string) => {
      const value = style?.getPropertyValue(name).trim() ?? '';
      return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    };
    return {
      accent: read('--accent', '#4f46e5'),
      ink: '#111827',
      muted: '#4b5563',
      light: '#eef2ff',
    };
  }
}

export function renderCv(pdf: jsPDF, cv: CvContent, c: Palette): void {
  const sidebar = () => {
    pdf.setFillColor(c.light);
    pdf.rect(0, 0, SIDE_W, PAGE_H, 'F');
    pdf.setFillColor(c.accent);
    pdf.rect(0, 0, 3, PAGE_H, 'F');
  };
  sidebar();

  // ---------- Colonne de gauche : contact, compétences, certifications ----------
  let y = 20;
  pdf.setTextColor(c.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text(cv.name.split(' '), MARGIN, y, { lineHeightFactor: 1 });
  y += 20;

  const sideTitle = (label: string) => {
    y += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(c.accent);
    pdf.text(clean(label).toUpperCase(), MARGIN, y, { charSpace: 0.4 });
    y += 5;
  };
  const sideText = (text: string, bold = false, size = 8.5) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(bold ? c.ink : c.muted);
    const lines = pdf.splitTextToSize(clean(text), SIDE_W - MARGIN - 6);
    pdf.text(lines, MARGIN, y);
    y += lines.length * size * 0.42 + 1.2;
  };

  sideTitle('Contact');
  for (const item of cv.contact) {
    sideText(item.label, true, 7.5);
    const before = y;
    sideText(item.value);
    if (item.url) pdf.link(MARGIN, before - 3, SIDE_W - MARGIN - 6, y - before, { url: item.url });
    y += 0.8;
  }

  sideTitle('Compétences');
  for (const group of cv.skills) {
    if (!group.skills.length) continue;
    sideText(group.label, true, 8);
    sideText(group.skills.join(' · '));
    y += 1.2;
  }

  if (cv.certifications.length) {
    sideTitle('Certifications');
    for (const cert of cv.certifications) sideText(cert);
  }

  // ---------- Colonne principale ----------
  y = 20;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(c.ink);
  pdf.text(clean(cv.kicker), MAIN_X, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(c.muted);
  const lead = pdf.splitTextToSize(clean(cv.lead), MAIN_W);
  pdf.text(lead, MAIN_X, y);
  y += lead.length * 4.3 + 1;
  pdf.setTextColor(c.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.text(clean(cv.status), MAIN_X, y);
  y += 4;

  const ensure = (height: number) => {
    if (y + height <= BOTTOM) return;
    pdf.addPage();
    sidebar();
    y = 18;
  };
  const title = (label: string) => {
    ensure(16);
    y += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(c.accent);
    pdf.text(clean(label).toUpperCase(), MAIN_X, y, { charSpace: 0.5 });
    pdf.setDrawColor(c.accent);
    pdf.setLineWidth(0.3);
    pdf.line(MAIN_X, y + 2, MAIN_X + MAIN_W, y + 2);
    y += 8;
  };
  const entry = (item: CvEntry) => {
    pdf.setFontSize(8.5);
    const meta = pdf.splitTextToSize(clean(item.meta), MAIN_W);
    pdf.setFontSize(9);
    const text = item.text ? pdf.splitTextToSize(clean(item.text), MAIN_W) : [];
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const heading = pdf.splitTextToSize(clean(item.title), MAIN_W);
    ensure(heading.length * 4.6 + meta.length * 3.8 + text.length * 4 + 3);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(c.ink);
    pdf.text(heading, MAIN_X, y);
    y += heading.length * 4.6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(c.accent);
    pdf.text(meta, MAIN_X, y);
    y += meta.length * 3.8;
    if (text.length) {
      pdf.setFontSize(9);
      pdf.setTextColor(c.muted);
      pdf.text(text, MAIN_X, y + 0.6);
      y += text.length * 4 + 0.6;
    }
    y += 3.4;
  };

  title('Expériences');
  cv.experiences.forEach(entry);
  title('Projets');
  cv.projects.forEach(entry);
  title('Formation');
  cv.education.forEach(entry);

  // Pied de page : d'où vient ce CV.
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(c.muted);
    pdf.text('Généré depuis le portfolio, à partir des mêmes données que le site.', MAIN_X, PAGE_H - 8);
  }
}

/** Les polices standard du PDF ne couvrent que le latin : on remplace le reste. */
function clean(text: string): string {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[→⇄↔]/g, '-')
    .replace(/[^\x20-\xff€…–—•]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
