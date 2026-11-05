import { ChangeDetectionStrategy, Component, VERSION, computed, inject } from '@angular/core';

import { LENS_WINDOW } from '@core/sync/window-size';
import { WindowBus } from '@core/sync/window-bus';
import { PROFILE } from '@domain/profile/profile.data';
import { WindowGesture } from '@shared/ui/window-gesture/window-gesture';

/**
 * « Sous le capot », sur la page du projet « Portfolio v2 » : comment le site est construit,
 * comment ouvrir la loupe, et le plan de la synchronisation entre fenêtres.
 */
@Component({
  selector: 'app-site-backstage',
  imports: [WindowGesture],
  templateUrl: './site-backstage.html',
  styleUrl: './site-backstage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteBackstage {
  private readonly bus = inject(WindowBus);

  protected readonly headline = PROFILE.headlines.coulisses;
  protected readonly lensSize = `${LENS_WINDOW.maxWidth} × ${LENS_WINDOW.maxHeight} px`;

  protected readonly specs = [
    { value: Number(VERSION.major), label: 'Angular, sans zone.js' },
    { value: 60, label: 'synchronisations par seconde' },
    { value: 2, label: 'fenêtres, une seule page' },
    { value: 0, label: "bibliothèque d'interface sur l'accueil" },
  ];

  /** Fenêtres réellement connectées en ce moment, celle-ci comprise. */
  protected readonly mains = computed(() => this.bus.otherMains() + 1);
  protected readonly lenses = computed(() => this.bus.otherLenses());
}
