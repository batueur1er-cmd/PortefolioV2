import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project } from '@domain/profile/profile.model';
import { projectLink } from '@domain/profile/projects';
import { TiltDirective } from '@shared/motion/tilt.directive';
import { TagList } from '@shared/ui/tag-list';

import { ProjectArt } from '../project-art/project-art';

export interface ProjectView extends Project {
  readonly secretId: string;
  readonly skillLabels: readonly string[];
}

/** Une réalisation : illustration animée, contexte, points marquants, technologies. */
@Component({
  selector: 'app-project-card',
  imports: [ProjectArt, TagList, TiltDirective, RouterLink],
  template: `
    <article class="card" appTilt="4" [attr.data-x]="'article · visuel ' + project().visual">
      <div class="frame">
        <app-project-art
          [visual]="project().visual"
          [images]="project().images ?? []"
          [secretId]="project().secretId"
          [secret]="project().secret"
        />
        <span class="num" aria-hidden="true">{{ number() < 10 ? '0' + number() : number() }}</span>
      </div>
      <div class="body">
        <p class="meta">
          <span>{{ project().context }}</span>
          @if (project().year; as year) {
            <span>{{ year }}</span>
          }
        </p>
        <h3 class="title">
          <a class="title-link" [routerLink]="link(project().id)">{{ project().title }}</a>
        </h3>
        <p class="summary">{{ project().summary }}</p>
        <ul class="highlights">
          @for (line of project().highlights; track line) {
            <li>{{ line }}</li>
          }
        </ul>
        <p class="case" aria-hidden="true">Voir le projet <span>→</span></p>
        <div class="foot">
          <app-tag-list [tags]="project().skillLabels" />
          @if (project().repo; as repo) {
            <a class="repo" [href]="repo" target="_blank" rel="noopener">
              Voir le dépôt <span aria-hidden="true">↗</span>
              <span class="sr-only">(GitHub, nouvel onglet)</span>
            </a>
          }
        </div>
      </div>
    </article>
  `,
  styleUrl: './project-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<ProjectView>();
  readonly number = input(1);
  protected readonly link = projectLink;
}
