import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { ProjectView } from '../project-card/project-card';
import { ProjectsList } from '../projects-list/projects-list';

export interface ProjectsDialogData {
  readonly projects: readonly ProjectView[];
  readonly firstNumber: number;
}

/** Classe du panneau : la fenêtre portfolio la retrouve pour l'annoncer à la loupe. */
export const PROJECTS_DIALOG_PANEL = 'projects-dialog-panel';

/** La fenêtre « Tous les projets » : les réalisations qui ne tiennent pas sur la page. */
@Component({
  selector: 'app-projects-dialog',
  imports: [MatDialogModule, ProjectsList],
  template: `
    <header class="head">
      <p class="kicker">Réalisations · suite</p>
      <h2 mat-dialog-title class="title">Les autres projets</h2>
      <button type="button" class="close" mat-dialog-close aria-label="Fermer">×</button>
    </header>
    <mat-dialog-content class="content">
      <app-projects-list [projects]="data.projects" [firstNumber]="data.firstNumber" (picked)="ref.close()" />
    </mat-dialog-content>
  `,
  styleUrl: './projects-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsDialog {
  protected readonly data = inject<ProjectsDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<ProjectsDialog>);
}
