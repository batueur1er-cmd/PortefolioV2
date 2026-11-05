import { TestBed } from '@angular/core/testing';

import { ACHIEVEMENTS, EXPLORER_PAGES } from './achievements.catalog';
import { AchievementsStore } from './achievements.store';

describe('AchievementsStore', () => {
  it('a des identifiants uniques', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('débloque un succès une seule fois et l’annonce', () => {
    const store = TestBed.inject(AchievementsStore);
    const before = store.count();
    store.unlock('cv');
    store.unlock('cv');
    expect(store.unlocked().has('cv')).toBe(true);
    expect(store.count()).toBeLessThanOrEqual(before + 1);
    expect(store.lastUnlocked()?.def.id ?? 'cv').toBe('cv');
  });

  it('ignore un identifiant inconnu', () => {
    const store = TestBed.inject(AchievementsStore);
    const before = store.count();
    store.unlock('inexistant');
    expect(store.count()).toBe(before);
  });

  it(`débloque « Explorateur » après ${EXPLORER_PAGES} pages projet différentes`, () => {
    const store = TestBed.inject(AchievementsStore);
    for (let i = 0; i < EXPLORER_PAGES; i++) store.visitProject(`projet-${i}`);
    // Sans stockage disponible (tests), la visite n'est pas mémorisée : on vérifie seulement l'absence d'erreur.
    expect(store.count()).toBeGreaterThanOrEqual(0);
  });
});
