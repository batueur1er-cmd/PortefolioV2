import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { projectLink } from '@domain/profile/projects';
import { DisplayOnlySecretHost, SecretHost } from '@features/secrets/secret-host';
import { TagList } from '@shared/ui/tag-list';

import { ProjectArt } from '../project-art/project-art';
import { ProjectView } from '../project-card/project-card';

/**
 * La liste des autres projets. Elle sert deux fois : dans la vraie fenêtre « Tous les projets »
 * et dans sa copie rayons X affichée par la loupe. Les deux doivent donc avoir la même mise en page.
 */
@Component({
  selector: 'app-projects-list',
  imports: [RouterLink, TagList, ProjectArt],
  providers: [{ provide: SecretHost, useClass: DisplayOnlySecretHost }],
  template: `
    <ul class="list">
      @for (project of projects(); track project.id) {
        <li class="item" [style.--i]="$index">
          <a class="thumb" [routerLink]="link(project.id)" (click)="picked.emit()" tabindex="-1" aria-hidden="true">
            <app-project-art
              [visual]="project.visual"
              [images]="project.images ?? []"
              [secretId]="project.secretId"
              [secret]="project.secret"
            />
            <span class="num">{{ pad($index + firstNumber()) }}</span>
          </a>
          <div class="body">
            <p class="meta">
              <span>{{ project.context }}</span>
              @if (project.year; as year) {
                <span>{{ year }}</span>
              }
            </p>
            <h3 class="name">
              <a [routerLink]="link(project.id)" (click)="picked.emit()">{{ project.title }}</a>
            </h3>
            <p class="summary">{{ project.summary }}</p>
            <app-tag-list [tags]="project.skillLabels" />
          </div>
        </li>
      }
    </ul>
  `,
  styleUrl: './projects-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsList {
  readonly projects = input.required<readonly ProjectView[]>();
  readonly firstNumber = input(1);
  /** Un projet a été choisi : la fenêtre peut se fermer. */
  readonly picked = output<void>();

  protected readonly link = projectLink;

  protected pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }
}
