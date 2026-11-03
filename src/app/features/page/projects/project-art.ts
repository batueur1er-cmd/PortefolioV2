import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ProjectVisual } from '@domain/profile/profile.model';
import { SecretDirective } from '@features/secrets/secret.directive';
import { WindowGesture } from '@shared/ui/window-gesture';

/**
 * L'illustration d'un projet. En surface, une petite interface animée en CSS ; en rayons X, son
 * plan de principe (un secret à trouver), au même endroit et à la même taille.
 */
@Component({
  selector: 'app-project-art',
  imports: [SecretDirective, WindowGesture],
  templateUrl: './project-art.html',
  styleUrl: './project-art.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"art art-" + visual()' },
})
export class ProjectArt {
  readonly visual = input.required<ProjectVisual>();
  readonly secretId = input.required<string>();
  readonly secret = input.required<string>();

  protected readonly bars = [0.42, 0.7, 0.55, 0.92, 0.64, 0.8];
  protected readonly posters = [0, 1, 2, 3, 4, 5, 6, 7];
  protected readonly alerts = [
    { level: 'high', width: 62 },
    { level: 'mid', width: 48 },
    { level: 'ok', width: 70 },
  ];
  protected readonly nodes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}
