import { Profile } from '@domain/profile/profile.model';
import { coOccurrence, skillSources } from '@domain/skills/skills-graph';

/** Une étoile par compétence, et un lien entre celles utilisées ensemble dans un même projet. */
export interface StarMap {
  readonly ids: readonly string[];
  readonly links: readonly (readonly [number, number])[];
}

export function starMap(profile: Profile): StarMap {
  const ids = profile.skills.map((s) => s.id);
  const index = new Map(ids.map((id, i) => [id, i]));
  const links = coOccurrence(skillSources(profile)).flatMap((edge): (readonly [number, number])[] => {
    const a = index.get(edge.a);
    const b = index.get(edge.b);
    return a === undefined || b === undefined ? [] : [[a, b]];
  });
  return { ids, links };
}

export interface SectionBox {
  readonly id: string;
  readonly top: number;
}

/** Quand une section liste plusieurs choses, la position dans la section choisit laquelle est à l'écran. */
const pick = <T>(items: readonly T[], fraction: number): T | undefined => items[Math.min(items.length - 1, Math.floor(fraction * items.length))];

/** Les compétences à allumer quand ce point de la page est au milieu de la fenêtre. */
export function litSkills(profile: Profile, projectsOnPage: number, sections: readonly SectionBox[], y: number): ReadonlySet<string> {
  let current = -1;
  sections.forEach((section, i) => {
    if (section.top <= y) current = i;
  });
  if (current < 0) return new Set();
  const top = sections[current].top;
  const next = sections[current + 1]?.top ?? top + 1;
  const fraction = Math.max(0, Math.min(1, (y - top) / Math.max(1, next - top)));
  switch (sections[current].id) {
    case 'parcours':
      return new Set(pick(profile.experiences.filter((e) => e.skills.length), fraction)?.skills);
    case 'realisations':
      return new Set(pick(profile.projects.slice(0, projectsOnPage), fraction)?.skills);
    case 'competences':
      return new Set(profile.skills.map((s) => s.id));
    case 'formation':
      return new Set(profile.otherSkillSources.filter((s) => s.id !== 'linkedin').flatMap((s) => s.skills));
    default:
      return new Set();
  }
}
