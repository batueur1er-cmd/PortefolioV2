import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TODAY } from '@core/time/time';
import { careerTotals } from '@domain/career/career';
import { PROFILE } from '@domain/profile/profile.data';
import { SecretDirective } from '@features/secrets/secret.directive';
import { CountUp } from '@shared/motion/count-up';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { ScrollWords } from '@shared/motion/scroll-words';
import { SectionHeader } from '@shared/ui/section-header/section-header';

import { PageContext } from '../page-context';

@Component({
  selector: 'app-about-section',
  imports: [SecretDirective, SectionHeader, ScrollWords, RevealDirective, CountUp],
  templateUrl: './about-section.html',
  styleUrl: './about-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  protected readonly page = inject(PageContext);
  protected readonly headline = PROFILE.headlines.profil;
  protected readonly about = PROFILE.about;
  protected readonly totals = careerTotals(PROFILE, inject(TODAY));
  protected readonly current = PROFILE.experiences.find((e) => e.end === null);
  protected readonly school = PROFILE.education[0];
  protected readonly city = PROFILE.city;

  protected readonly facts = [
    { value: PROFILE.experiences.length, label: 'expériences en entreprise' },
    { value: this.totals.totalMonths, label: 'mois sur le terrain' },
    { value: PROFILE.projects.length, label: 'projets menés' },
    { value: PROFILE.education.length, label: 'diplômes et formations' },
  ];
}
