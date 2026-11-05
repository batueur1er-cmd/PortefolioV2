import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, VERSION, computed, inject, signal } from '@angular/core';

import { Clock, formatClock } from '@core/time/clock';
import { TODAY } from '@core/time/time';
import { PROFILE } from '@domain/profile/profile.data';
import { CvDownload } from '@features/cv/cv-download';
import { MagneticDirective } from '@shared/motion/magnetic.directive';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { SplitText } from '@shared/motion/split-text';
import { SectionHeader } from '@shared/ui/section-header/section-header';

import { PageContext } from '../page-context';

@Component({
  selector: 'app-contact-section',
  imports: [SectionHeader, SplitText, MagneticDirective, RevealDirective],
  templateUrl: './contact-section.html',
  styleUrl: './contact-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSection {
  protected readonly page = inject(PageContext);
  protected readonly cv = inject(CvDownload);
  private readonly clock = inject(Clock);
  private readonly win = inject(DOCUMENT).defaultView;

  protected readonly headline = PROFILE.headlines.contact;
  protected readonly contact = PROFILE.contact;
  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly city = PROFILE.city;
  protected readonly location = PROFILE.location;
  protected readonly year = inject(TODAY).getFullYear();
  protected readonly angularMajor = VERSION.major;
  protected readonly time = computed(() => formatClock(this.clock.now()).slice(0, 5));
  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected async copy(): Promise<void> {
    try {
      await this.win?.navigator.clipboard.writeText(this.contact.email);
      this.copied.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), 2400);
    } catch {
      // Presse-papiers refusé : le lien mailto reste disponible.
    }
  }
}
