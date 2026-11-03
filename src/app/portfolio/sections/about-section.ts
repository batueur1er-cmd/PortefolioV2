import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PROFILE } from '../../core/profile.data';
import { TODAY, monthsInclusive } from '../../core/time';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

@Component({
  selector: 'app-about-section',
  imports: [SecretDirective],
  templateUrl: './about-section.html',
  styleUrl: './about-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSection {
  protected readonly page = inject(PageContext);
  private readonly today = inject(TODAY);

  protected readonly about = PROFILE.about;
  protected readonly experienceCount = PROFILE.experiences.length;
  protected readonly educationCount = PROFILE.education.length;
  protected readonly certificationCount = PROFILE.certifications.length;

  private readonly months = PROFILE.experiences.map((e) => monthsInclusive(e.start, e.end, this.today));
  protected readonly totalMonths = this.months.reduce((sum, m) => sum + m, 0);
  protected readonly breakdown = `${this.months.join(' + ')} = ${this.totalMonths} mois · recalculé chaque jour`;
}
