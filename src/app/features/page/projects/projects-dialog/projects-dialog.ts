import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { OverlayPresence } from '@core/sync/window-bus';

import { PROJECT_VIEWS } from '../project-views';
import { ProjectsList } from '../projects-list/projects-list';

export interface ProjectsDialogData {
  /** Rang (à partir de 0) du premier projet listé : 0 pour tous, sinon ceux qui suivent la page. */
  readonly from: number;
}

/** Classe du panneau : la fenêtre portfolio la retrouve pour l'annoncer à la loupe. */
export const PROJECTS_DIALOG_PANEL = 'projects-dialog-panel';

/** Titre et surtitre de la fenêtre, selon qu'elle liste tout ou seulement la suite. */
export const projectsDialogHeading = (from: number): { kicker: string; title: string } =>
  from === 0
    ? { kicker: 'Réalisations', title: 'Tous les projets' }
    : { kicker: 'Réalisations · suite', title: 'Les autres projets' };

/** Ouvre la fenêtre des projets, à partir du projet de rang `from`. */
export function openProjectsDialog(dialog: MatDialog, from: number): void {
  dialog.open<ProjectsDialog, ProjectsDialogData>(ProjectsDialog, {
    data: { from },
    panelClass: PROJECTS_DIALOG_PANEL,
    width: '960px',
    maxWidth: 'calc(100vw - 32px)',
    autoFocus: 'dialog',
  });
}

/** La fenêtre des projets, si elle est ouverte, telle que la loupe doit la recopier. */
export function measureProjectsOverlay(doc: Document): OverlayPresence | null {
  const surface = doc.querySelector<HTMLElement>(`.${PROJECTS_DIALOG_PANEL} .mat-mdc-dialog-surface`);
  if (!surface || !surface.offsetWidth) return null;
  const rect = surface.getBoundingClientRect();
  const content = surface.querySelector<HTMLElement>('.mat-mdc-dialog-content');
  const container = surface.closest<HTMLElement>('.mat-mdc-dialog-container');
  const from = Number(surface.querySelector<HTMLElement>('app-projects-dialog')?.dataset['from'] ?? 0);
  return {
    id: 'projects',
    from,
    cx: Math.round(rect.left + rect.width / 2),
    cy: Math.round(rect.top + rect.height / 2),
    w: surface.offsetWidth,
    h: surface.offsetHeight,
    scale: Math.round((rect.width / surface.offsetWidth) * 1000) / 1000,
    opacity: container ? Math.round(Number(getComputedStyle(container).opacity) * 100) / 100 : 1,
    contentHeight: content?.clientHeight ?? 0,
    contentTop: content ? Math.round(content.getBoundingClientRect().top - rect.top) : 0,
    scrollTop: Math.round(content?.scrollTop ?? 0),
  };
}

/** La fenêtre des projets : tous, ou seulement ceux qui ne tiennent pas sur la page. */
@Component({
  selector: 'app-projects-dialog',
  imports: [MatDialogModule, ProjectsList],
  template: `
    <header class="head">
      <p class="kicker">{{ heading.kicker }}</p>
      <h2 mat-dialog-title class="title">{{ heading.title }}</h2>
      <button type="button" class="close" mat-dialog-close aria-label="Fermer">×</button>
    </header>
    <mat-dialog-content class="content">
      <app-projects-list [projects]="projects" [firstNumber]="data.from + 1" (picked)="ref.close()" />
    </mat-dialog-content>
  `,
  styleUrl: './projects-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-from]': 'data.from' },
})
export class ProjectsDialog {
  protected readonly data = inject<ProjectsDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<ProjectsDialog>);
  protected readonly projects = PROJECT_VIEWS.slice(this.data.from);
  protected readonly heading = projectsDialogHeading(this.data.from);
}
