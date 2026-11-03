import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PROFILE } from '@domain/profile/profile.data';
import { RevealDirective } from '@shared/motion/reveal.directive';
import { SectionHeader } from '@shared/ui/section-header';

import { PageContext } from '../page-context';
import { ProjectCard, ProjectView } from './project-card';

const SKILL_LABELS = new Map(PROFILE.skills.map((s) => [s.id, s.label]));

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
        [count]="projects.length"
        [titleId]="page.anchor('realisations-titre')"
      />
      <div class="grid">
        @for (project of projects; track project.id) {
          <app-project-card
            [project]="project"
            [number]="$index + 1"
            [class.featured]="project.featured"
            [appReveal]="($index % 3) * 110"
          />
        }
      </div>
    </section>
  `,
  styleUrl: './projects-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSection {
  protected readonly page = inject(PageContext);
  protected readonly headline = PROFILE.headlines.realisations;
  protected readonly projects: readonly ProjectView[] = PROFILE.projects.map((project) => ({
    ...project,
    secretId: `proj-${project.id}`,
    skillLabels: project.skills.map((id) => SKILL_LABELS.get(id) ?? id),
  }));
}
