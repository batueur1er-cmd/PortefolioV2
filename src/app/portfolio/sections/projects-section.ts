import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PROFILE } from '../../core/profile.data';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

const SKILL_LABELS = new Map(PROFILE.skills.map((s) => [s.id, s.label]));

@Component({
  selector: 'app-projects-section',
  imports: [SecretDirective],
  templateUrl: './projects-section.html',
  styleUrl: './projects-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSection {
  protected readonly page = inject(PageContext);
  protected readonly projects = PROFILE.projects.map((project) => ({
    ...project,
    secretId: `proj-${project.id}`,
    skillLabels: project.skills.map((id) => SKILL_LABELS.get(id) ?? id),
  }));
}
