import { PAGES, metaFor } from './seo';
import { PROFILE } from './profile.data';

describe('métadonnées des pages', () => {
  it('a une page par projet et par démo, plus l’accueil', () => {
    const demos = PROFILE.projects.filter((p) => p.demo).length;
    expect(PAGES.length).toBe(PROFILE.projects.length + demos + 1);
    expect(new Set(PAGES.map((p) => p.path)).size).toBe(PAGES.length);
  });

  it('donne à la démo du visualiseur 3D ses propres balises', () => {
    const demo = metaFor('/projets/visu3d/demo');
    expect(demo.path).toBe('/projets/visu3d/demo');
    expect(demo.title).toContain('Visualiseur 3D');
    expect(demo.image).toBe('/og/visu3d.png');
  });

  it('donne à la démo façon Doom ses propres balises', () => {
    const demo = metaFor('/projets/doom/demo');
    expect(demo.path).toBe('/projets/doom/demo');
    expect(demo.title).toContain('façon Doom');
    expect(demo.image).toBe('/og/doom.png');
  });

  it('retombe sur l’accueil pour une adresse inconnue', () => {
    expect(metaFor('/nulle-part').path).toBe('/');
  });

  it('garde des descriptions raisonnables pour les aperçus', () => {
    for (const page of PAGES) expect(page.description.length).toBeLessThan(320);
  });
});
