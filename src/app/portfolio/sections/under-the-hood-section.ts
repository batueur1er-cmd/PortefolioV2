import { ChangeDetectionStrategy, Component, VERSION, computed, inject } from '@angular/core';

import { SecretsStore } from '../../core/secrets.store';
import { WindowBus } from '../../core/window-bus';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

@Component({
  selector: 'app-under-the-hood-section',
  imports: [SecretDirective],
  templateUrl: './under-the-hood-section.html',
  styleUrl: './under-the-hood-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnderTheHoodSection {
  protected readonly page = inject(PageContext);
  private readonly bus = inject(WindowBus);
  protected readonly total = inject(SecretsStore).total;
  protected readonly angularMajor = VERSION.major;

  /** Fenêtres réellement connectées en ce moment, celle-ci comprise. */
  protected readonly mains = computed(() => this.bus.otherMains() + (this.bus.role() === 'main' ? 1 : 0));
  protected readonly lenses = computed(() => this.bus.otherLenses() + (this.bus.role() === 'lens' ? 1 : 0));
}
