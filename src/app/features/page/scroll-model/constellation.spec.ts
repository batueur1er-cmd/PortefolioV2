import { PROFILE } from '@domain/profile/profile.data';

import { SectionBox, litSkills, starMap } from './constellation';

describe('La constellation des compétences', () => {
  const sections: SectionBox[] = [
    { id: 'accueil', top: 0 },
    { id: 'parcours', top: 1000 },
    { id: 'realisations', top: 2000 },
    { id: 'competences', top: 3000 },
    { id: 'contact', top: 4000 },
  ];
  const lit = (y: number) => litSkills(PROFILE, 5, sections, y);

  it('a une étoile par compétence, et des liens entre étoiles existantes', () => {
    const map = starMap(PROFILE);
    expect(map.ids.length).toBe(PROFILE.skills.length);
    expect(map.links.length).toBeGreaterThan(0);
    for (const [a, b] of map.links) {
      expect(map.ids[a]).toBeDefined();
      expect(map.ids[b]).toBeDefined();
    }
  });

  it('n’allume rien sur l’accueil ni le contact', () => {
    expect(lit(100).size).toBe(0);
    expect(lit(4500).size).toBe(0);
  });

  it('allume le projet qui correspond à la position dans la section', () => {
    expect([...lit(2010)].sort()).toEqual([...PROFILE.projects[0].skills].sort());
    expect([...lit(2990)].sort()).toEqual([...PROFILE.projects[4].skills].sort());
  });

  it('allume toutes les étoiles sur les compétences', () => {
    expect(lit(3500).size).toBe(PROFILE.skills.length);
  });
});
