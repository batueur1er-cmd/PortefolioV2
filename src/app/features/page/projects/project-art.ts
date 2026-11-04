import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { Clock } from '@core/time/clock';
import { ProjectImage, ProjectVisual } from '@domain/profile/profile.model';
import { SecretDirective } from '@features/secrets/secret.directive';

/** Durée d'affichage de chaque capture du diaporama, en ms. */
const SLIDE_MS = 4000;

/**
 * L'illustration d'un projet. En surface, ses captures qui défilent, ou à défaut une petite
 * interface animée en CSS ; en rayons X, son plan de principe (un secret à trouver), au même
 * endroit et à la même taille.
 */
@Component({
  selector: 'app-project-art',
  imports: [SecretDirective, NgOptimizedImage],
  templateUrl: './project-art.html',
  styleUrl: './project-art.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"art art-" + visual()' },
})
export class ProjectArt {
  readonly visual = input.required<ProjectVisual>();
  readonly secretId = input.required<string>();
  readonly secret = input.required<string>();
  readonly images = input<readonly ProjectImage[]>([]);

  private readonly clock = inject(Clock);
  /** Capture affichée, calée sur l'horloge : toutes les fenêtres montrent la même. */
  protected readonly slide = computed(() => {
    const count = this.images().length;
    return count > 1 ? Math.floor(this.clock.now() / SLIDE_MS) % count : 0;
  });

  protected readonly alerts = [
    { level: 'high', width: 62 },
    { level: 'mid', width: 48 },
    { level: 'ok', width: 70 },
  ];
  protected readonly posters = [0, 1, 2, 3, 4, 5, 6, 7];
  protected readonly nodes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  protected readonly faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
}
