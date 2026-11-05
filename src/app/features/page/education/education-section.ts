import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TODAY, formatPeriod } from '@core/time/time';
import { acronymDecoder, educationRuler, educationSpan } from '@domain/career/career';
import { PROFILE } from '@domain/profile/profile.data';
import { SecretDirective } from '@features/secrets/secret.directive';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { SectionHeader } from '@shared/ui/section-header/section-header';

import { PageContext } from '../page-context';

@Component({
  selector: 'app-education-section',
  imports: [SecretDirective, SectionHeader, RevealDirective],
  templateUrl: './education-section.html',
  styleUrl: './education-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationSection {
  protected readonly page = inject(PageContext);
  protected readonly headline = PROFILE.headlines.formation;
  protected readonly items = PROFILE.education.map((education) => ({
    ...education,
    period: formatPeriod(education.start, education.end),
  }));
  protected readonly certifications = PROFILE.certifications;
  protected readonly ruler = educationRuler(PROFILE.education);
  /** Décodeur d'acronymes, construit à partir des formations et certifications. */
  protected readonly decoder = acronymDecoder(PROFILE);
  protected readonly span = educationSpan(PROFILE.education, inject(TODAY));
}
