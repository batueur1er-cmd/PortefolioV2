import { PROFILE } from '../profile/profile.data';
import { coOccurrence, skillSources, sourceSummary, sourcesBySkill } from './skills-graph';

describe('skills-graph', () => {
  it('lie les compétences qui apparaissent ensemble', () => {
    const edges = coOccurrence([
      { id: 'a', label: 'A', skills: ['x', 'y', 'z'] },
      { id: 'b', label: 'B', skills: ['y', 'x'] },
    ]);
    expect(edges[0]).toEqual({ a: 'x', b: 'y', weight: 2 });
    expect(edges).toHaveLength(3);
  });

  it('résume les sources d’une compétence', () => {
    expect(sourceSummary([])).toBe('');
    expect(sourceSummary(['Celere'])).toBe('↳ Celere');
    expect(sourceSummary(['Celere', 'CRM interne', 'Portfolio v2'])).toBe('↳ Celere +2');
  });

  it('ne référence que des compétences déclarées dans le profil', () => {
    const known = new Set(PROFILE.skills.map((s) => s.id));
    for (const source of skillSources(PROFILE)) {
      for (const skill of source.skills) expect(known.has(skill), `${source.id} → ${skill}`).toBe(true);
    }
    expect(sourcesBySkill(skillSources(PROFILE)).get('angular')).toContain('Celere');
  });
});
