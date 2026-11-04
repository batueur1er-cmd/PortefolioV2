import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

import { projectLink } from '@domain/profile/projects';
import { TagList } from '@shared/ui/tag-list';

import { ProjectView } from './project-card';

export interface ProjectsDialogData {
  readonly projects: readonly ProjectView[];
  readonly firstNumber: number;
}

/** La fenêtre « Tous les projets » : les réalisations qui ne tiennent pas sur la page. */
@Component({
  selector: 'app-projects-dialog',
  imports: [MatDialogModule, RouterLink, TagList],
  template: `
    <header class="head">
      <p class="kicker">Réalisations · suite</p>
      <h2 mat-dialog-title class="title">Les autres projets</h2>
      <button type="button" class="close" mat-dialog-close aria-label="Fermer">×</button>
    </header>
    <mat-dialog-content class="content">
      <ul class="list">
        @for (project of data.projects; track project.id) {
          <li class="item" [style.--i]="$index">
            <a class="thumb" [routerLink]="link(project.id)" mat-dialog-close tabindex="-1" aria-hidden="true">
              @if (project.images?.[0]; as image) {
                <img [src]="image.src" alt="" loading="lazy" />
              } @else {
                <span class="initial">{{ project.title.charAt(0) }}</span>
              }
              <span class="num">{{ pad($index + data.firstNumber) }}</span>
            </a>
            <div class="body">
              <p class="meta">
                <span>{{ project.context }}</span>
                @if (project.year; as year) {
                  <span>{{ year }}</span>
                }
              </p>
              <h3 class="name">
                <a [routerLink]="link(project.id)" mat-dialog-close>{{ project.title }}</a>
              </h3>
              <p class="summary">{{ project.summary }}</p>
              <app-tag-list [tags]="project.skillLabels" />
            </div>
          </li>
        }
      </ul>
    </mat-dialog-content>
  `,
  styleUrl: './projects-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsDialog {
  protected readonly data = inject<ProjectsDialogData>(MAT_DIALOG_DATA);
  protected readonly link = projectLink;

  protected pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }
}
