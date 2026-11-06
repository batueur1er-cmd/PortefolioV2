import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Les projets qui ont un plan de principe dessiné. */
export const SCHEMA_VISUALS: readonly string[] = ['argus', 'crm', 'cine', 'drive', 'magasin', 'visu3d', 'doom', 'infra'];

export const hasSchema = (visual: string | undefined): boolean => !!visual && SCHEMA_VISUALS.includes(visual);

/**
 * Le plan de principe d'un projet, en traits « rayons X » (styles `.wire` globaux). Il remplit
 * son hôte : à l'appelant de lui donner une place et une taille. Révélé par la loupe sur la carte
 * du projet, affiché en clair sur sa page.
 */
@Component({
  selector: 'app-project-schema',
  templateUrl: './project-schema.html',
  styles: `
    :host {
      display: block;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSchema {
  readonly visual = input.required<string>();
  /** Garde une bande vide en haut, sous l'étiquette posée sur la carte du projet. */
  readonly reserveTop = input(true);

  /** Les plans sont dessinés entre y = 0 et y = 240 (légendes du bas comprises). */
  protected readonly viewBox = computed(() => (this.reserveTop() ? '0 -40 400 285' : '0 0 400 245'));
}
