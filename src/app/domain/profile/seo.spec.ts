import { PAGES, metaFor } from './seo';
import { PROFILE } from './profile.data';

describe('métadonnées des pages', () => {
  it('a une page par projet, plus l’accueil', () => {
    expect(PAGES.length).toBe(PROFILE.projects.length + 1);
    expect(new Set(PAGES.map((p) => p.path)).size).toBe(PAGES.length);
  });

  it('retombe sur l’accueil pour une adresse inconnue', () => {
    expect(metaFor('/nulle-part').path).toBe('/');
  });

  it('garde des descriptions raisonnables pour les aperçus', () => {
    for (const page of PAGES) expect(page.description.length).toBeLessThan(320);
  });
});
