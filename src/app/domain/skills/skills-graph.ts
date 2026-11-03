import { Profile, SkillSource } from '../profile/profile.model';

export interface SkillEdge {
  readonly a: string;
  readonly b: string;
  /** Nombre de sources où les deux compétences apparaissent ensemble. */
  readonly weight: number;
}

/** Tout ce qui justifie une compétence : expériences, projets, formation, LinkedIn. */
export function skillSources(profile: Profile): SkillSource[] {
  return [
    ...profile.experiences.map((e) => ({ id: `exp-${e.id}`, label: e.shortName, skills: e.skills })),
    ...profile.projects.map((p) => ({ id: `proj-${p.id}`, label: p.title, skills: p.skills })),
    ...profile.otherSkillSources,
  ].filter((source) => source.skills.length > 0);
}

/** Graphe de co-occurrence : deux compétences sont liées si une même source les mobilise. */
export function coOccurrence(sources: readonly SkillSource[]): SkillEdge[] {
  const weights = new Map<string, number>();
  for (const source of sources) {
    const skills = [...new Set(source.skills)].sort();
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const key = `${skills[i]}|${skills[j]}`;
        weights.set(key, (weights.get(key) ?? 0) + 1);
      }
    }
  }
  return [...weights]
    .map(([key, weight]) => {
      const [a, b] = key.split('|');
      return { a, b, weight };
    })
    .sort((x, y) => y.weight - x.weight || x.a.localeCompare(y.a) || x.b.localeCompare(y.b));
}

export function sourcesBySkill(sources: readonly SkillSource[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const source of sources) {
    for (const skill of source.skills) {
      const labels = result.get(skill) ?? [];
      if (!labels.includes(source.label)) labels.push(source.label);
      result.set(skill, labels);
    }
  }
  return result;
}

/** Annotation courte affichée sous une compétence : « ↳ Celere +2 ». */
export function sourceSummary(labels: readonly string[]): string {
  if (!labels.length) return '';
  return labels.length > 1 ? `↳ ${labels[0]} +${labels.length - 1}` : `↳ ${labels[0]}`;
}
