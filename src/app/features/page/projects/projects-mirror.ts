import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { OTHERS_FIRST_NUMBER, OTHER_PROJECTS } from './project-views';
import { ProjectsList } from './projects-list';

/**
 * La copie rayons X de la fenêtre « Tous les projets », affichée par la loupe quand le portfolio
 * l'a ouverte. Même gabarit et mêmes tailles que l'original ; le défilement de la liste est recopié.
 */
@Component({
  selector: 'app-projects-mirror',
  imports: [ProjectsList],
  template: `
    <header class="head">
      <p class="kicker">Réalisations · suite <span class="tag">&lt;mat-dialog&gt;</span></p>
      <h2 class="title">Les autres projets</h2>
      <span class="close" aria-hidden="true">×</span>
    </header>
    <div class="content mirror-content" [style.height.px]="contentHeight()">
      <app-projects-list
        [projects]="projects"
        [firstNumber]="firstNumber"
        [style.transform]="'translateY(' + -scrollTop() + 'px)'"
      />
    </div>
  `,
  styleUrls: ['./projects-dialog.scss', './projects-mirror.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'xray', 'aria-hidden': 'true', inert: '' },
})
export class ProjectsMirror {
  /** Défilement de la liste dans la vraie fenêtre. */
  readonly scrollTop = input(0);
  /** Hauteur visible de la liste dans la vraie fenêtre. */
  readonly contentHeight = input<number | null>(null);

  protected readonly projects = OTHER_PROJECTS;
  protected readonly firstNumber = OTHERS_FIRST_NUMBER;
}
