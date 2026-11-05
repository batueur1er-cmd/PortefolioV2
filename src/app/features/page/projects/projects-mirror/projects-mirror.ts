import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { OTHERS_FIRST_NUMBER, PROJECT_VIEWS } from '../project-views';
import { projectsDialogHeading } from '../projects-dialog/projects-dialog';
import { ProjectsList } from '../projects-list/projects-list';

/**
 * La copie rayons X de la fenêtre « Tous les projets », affichée par la loupe quand le portfolio
 * l'a ouverte. Même gabarit et mêmes tailles que l'original ; le défilement de la liste est recopié.
 */
@Component({
  selector: 'app-projects-mirror',
  imports: [ProjectsList],
  template: `
    <header class="head" [style.height.px]="contentTop()">
      <p class="kicker">{{ heading().kicker }} <span class="tag">&lt;mat-dialog&gt;</span></p>
      <h2 class="title">{{ heading().title }}</h2>
      <span class="close" aria-hidden="true">×</span>
    </header>
    <div class="content mirror-content" [style.height.px]="contentHeight()">
      <app-projects-list
        [projects]="projects()"
        [firstNumber]="from() + 1"
        [style.transform]="'translateY(' + -scrollTop() + 'px)'"
      />
    </div>
  `,
  styleUrls: ['../projects-dialog/projects-dialog.scss', './projects-mirror.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'xray', 'aria-hidden': 'true', inert: '' },
})
export class ProjectsMirror {
  /** Défilement de la liste dans la vraie fenêtre. */
  readonly scrollTop = input(0);
  /** Hauteur visible de la liste dans la vraie fenêtre. */
  readonly contentHeight = input<number | null>(null);
  /** Hauteur de l'en-tête dans la vraie fenêtre : la liste commence au même niveau. */
  readonly contentTop = input<number | null>(null);

  /** Rang du premier projet listé dans la vraie fenêtre. */
  readonly from = input(OTHERS_FIRST_NUMBER - 1);

  protected readonly projects = computed(() => PROJECT_VIEWS.slice(this.from()));
  protected readonly heading = computed(() => projectsDialogHeading(this.from()));
}
