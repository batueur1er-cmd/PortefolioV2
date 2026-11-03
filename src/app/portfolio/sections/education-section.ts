import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PROFILE } from '../../core/profile.data';
import { TODAY, formatPeriod, formatYearMonth, monthsInclusive } from '../../core/time';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

@Component({
  selector: 'app-education-section',
  imports: [SecretDirective],
  templateUrl: './education-section.html',
  styleUrl: './education-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationSection {
  protected readonly page = inject(PageContext);
  private readonly today = inject(TODAY);

  protected readonly items = PROFILE.education.map((education) => ({
    ...education,
    period: formatPeriod(education.start, education.end),
  }));
  protected readonly certifications = PROFILE.certifications;

  /** Décodeur d'acronymes, construit à partir des formations et certifications. */
  protected readonly decoder = [
    ...PROFILE.education.filter((e) => e.acronym).map((e) => `${e.acronym} = ${e.degree.replace(/^\S+\s/, '')}`),
    ...PROFILE.certifications.map((c) => `${c.label} = ${c.description}`),
  ].join('\n');

  protected readonly span: string;

  constructor() {
    const starts = PROFILE.education.map((e) => e.start).sort();
    const ends = PROFILE.education.map((e) => e.end).sort();
    const first = starts[0];
    const last = ends[ends.length - 1];
    const years = Math.round(monthsInclusive(first, last, this.today) / 12);
    this.span = `${formatYearMonth(first)} → ${formatYearMonth(last)} · ${years} ans de formation en ligne droite`;
  }
}
