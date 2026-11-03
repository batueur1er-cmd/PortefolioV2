import { ChangeDetectionStrategy, Component, VERSION, computed, inject } from '@angular/core';

import { LENS_WINDOW } from '@core/sync/window-size';
import { WindowBus } from '@core/sync/window-bus';
import { PROFILE } from '@domain/profile/profile.data';
import { SECRETS } from '@features/secrets/data/secrets.catalog';
import { SecretDirective } from '@features/secrets/secret.directive';
import { CountUp } from '@shared/motion/count-up';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { SectionHeader } from '@shared/ui/section-header';
import { WindowGesture } from '@shared/ui/window-gesture';

import { PageContext } from '../page-context';

/** « Sous le capot » : comment le site est construit, et comment ouvrir la loupe. */
@Component({
  selector: 'app-backstage-section',
  imports: [SecretDirective, SectionHeader, RevealDirective, CountUp, WindowGesture],
  templateUrl: './backstage-section.html',
  styleUrl: './backstage-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackstageSection {
  protected readonly page = inject(PageContext);
  private readonly bus = inject(WindowBus);

  protected readonly headline = PROFILE.headlines.coulisses;
  protected readonly angularMajor = Number(VERSION.major);
  protected readonly total = SECRETS.length;
  protected readonly lensSize = `${LENS_WINDOW.maxWidth} × ${LENS_WINDOW.maxHeight} px`;

  protected readonly specs = [
    { value: this.angularMajor, label: 'Angular, sans zone.js' },
    { value: 60, label: 'synchronisations par seconde' },
    { value: this.total, label: 'secrets à trouver' },
    { value: 0, label: "bibliothèque d'interface" },
  ];

  /** Fenêtres réellement connectées en ce moment, celle-ci comprise. */
  protected readonly mains = computed(() => this.bus.otherMains() + (this.bus.role() === 'main' ? 1 : 0));
  protected readonly lenses = computed(() => this.bus.otherLenses() + (this.bus.role() === 'lens' ? 1 : 0));
}
