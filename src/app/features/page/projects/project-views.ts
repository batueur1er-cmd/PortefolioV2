import { PROFILE } from '@domain/profile/profile.data';
import { PROJECTS_ON_PAGE, skillLabelsOf } from '@domain/profile/projects';

import { ProjectView } from './project-card';

/** Tous les projets, prêts à afficher. */
export const PROJECT_VIEWS: readonly ProjectView[] = PROFILE.projects.map((project) => ({
  ...project,
  secretId: `proj-${project.id}`,
  skillLabels: skillLabelsOf(project.skills),
}));

/** Ceux de la page, et ceux de la fenêtre « Tous les projets ». */
export const SHOWN_PROJECTS = PROJECT_VIEWS.slice(0, PROJECTS_ON_PAGE);
export const OTHER_PROJECTS = PROJECT_VIEWS.slice(PROJECTS_ON_PAGE);
export const OTHERS_FIRST_NUMBER = PROJECTS_ON_PAGE + 1;
