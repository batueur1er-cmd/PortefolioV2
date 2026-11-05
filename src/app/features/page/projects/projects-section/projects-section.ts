import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PROFILE } from '@domain/profile/profile.data';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { SectionHeader } from '@shared/ui/section-header/section-header';

import { PageContext } from '../../page-context';
import { ProjectCard } from '../project-card/project-card';
import { OTHERS_FIRST_NUMBER, OTHER_PROJECTS, PROJECT_VIEWS, SHOWN_PROJECTS } from '../project-views';
import { PROJECTS_DIALOG_PANEL, ProjectsDialog, ProjectsDialogData } from '../projects-dialog/projects-dialog';

/** Largeur de page (px) sous laquelle une seule réalisation reste sur la page (voir le SCSS). */
const NARROW_PAGE = 680;

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
      <!-- Sur mobile, une seule carte : les autres passent dans la fenêtre. -->
      @if (all.length > 1) {
        <div class="more">
          <button type="button" class="more-btn" (click)="openOthers()">
            Voir les
            <span class="n-wide">{{ others.length }}</span>
            <span class="n-narrow">{{ all.length - 1 }}</span>
            autres projets <span aria-hidden="true">→</span>
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
  protected readonly all = PROJECT_VIEWS;
  protected readonly shown = SHOWN_PROJECTS;
  protected readonly others = OTHER_PROJECTS;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected openOthers(): void {
    if (this.page.decorative()) return;
    // Même seuil que la requête de conteneur du gabarit : sur mobile, une seule carte est visible.
    const narrow = this.host.clientWidth <= NARROW_PAGE;
    this.dialog.open<ProjectsDialog, ProjectsDialogData>(ProjectsDialog, {
      data: narrow
        ? { projects: this.all.slice(1), firstNumber: 2 }
        : { projects: this.others, firstNumber: OTHERS_FIRST_NUMBER },
      panelClass: PROJECTS_DIALOG_PANEL,
      width: '960px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'dialog',
    });
  }
}
