import { PROFILE } from './profile.data';
import { Project } from './profile.model';

/** Nombre de réalisations montrées sur la page ; les autres sont dans la fenêtre « Tous les projets ». */
// Remplit exactement deux lignes de la grille de 3 colonnes : le projet mis en avant compte double.
export const PROJECTS_ON_PAGE = 5;

const SKILL_LABELS = new Map(PROFILE.skills.map((s) => [s.id, s.label]));

/** Libellés lisibles des compétences d'un projet. */
export function skillLabelsOf(ids: readonly string[]): readonly string[] {
  return ids.map((id) => SKILL_LABELS.get(id) ?? id);
}

export function projectById(id: string): Project | undefined {
  return PROFILE.projects.find((p) => p.id === id);
}

/** Adresse de la page d'un projet. */
export function projectLink(id: string): string {
  return `/projets/${id}`;
}
