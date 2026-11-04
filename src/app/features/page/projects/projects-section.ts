import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PROFILE } from '@domain/profile/profile.data';
import { PROJECTS_ON_PAGE, skillLabelsOf } from '@domain/profile/projects';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { SectionHeader } from '@shared/ui/section-header';

import { PageContext } from '../page-context';
import { ProjectCard, ProjectView } from './project-card';
import { ProjectsDialog, ProjectsDialogData } from './projects-dialog';

/**
 * Les réalisations : les premières sur la page, les autres dans une fenêtre « Tous les projets »
 * pour garder la section compacte.
 */
@Component({
  selector: 'app-projects-section',
  imports: [SectionHeader, ProjectCard, RevealDirective],
  template: `
    <section
      class="wrap sec"
      data-section="realisations"
      data-label="Réalisations"
      [attr.id]="page.anchor('realisations')"
      [attr.aria-labelledby]="page.anchor('realisations-titre')"
    >
      <app-section-header
        index="03"
        name="Réalisations"
        [title]="headline.title"
        [intro]="headline.intro ?? null"
        [count]="all.length"
        [titleId]="page.anchor('realisations-titre')"
      />
      <div class="grid">
        @for (project of shown; track project.id) {
          <app-project-card
            [project]="project"
            [number]="$index + 1"
            [class.featured]="project.featured"
            [appReveal]="($index % 3) * 110"
          />
        }
      </div>
      @if (others.length) {
        <div class="more">
          <button type="button" class="more-btn" (click)="openOthers()">
            Voir les {{ others.length }} autres projets <span aria-hidden="true">→</span>
          </button>
        </div>
      }
    </section>
  `,
  styleUrl: './projects-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSection {
  protected readonly page = inject(PageContext);
  private readonly dialog = inject(MatDialog);
  protected readonly headline = PROFILE.headlines.realisations;
  protected readonly all: readonly ProjectView[] = PROFILE.projects.map((project) => ({
    ...project,
    secretId: `proj-${project.id}`,
    skillLabels: skillLabelsOf(project.skills),
  }));
  protected readonly shown = this.all.slice(0, PROJECTS_ON_PAGE);
  protected readonly others = this.all.slice(PROJECTS_ON_PAGE);

  protected openOthers(): void {
    if (this.page.decorative()) return;
    this.dialog.open<ProjectsDialog, ProjectsDialogData>(ProjectsDialog, {
      data: { projects: this.others, firstNumber: PROJECTS_ON_PAGE + 1 },
      panelClass: 'projects-dialog-panel',
      width: '960px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'dialog',
    });
  }
}
