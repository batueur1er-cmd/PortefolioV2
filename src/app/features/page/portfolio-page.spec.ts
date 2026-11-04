import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PROFILE } from '@domain/profile/profile.data';
import { PROJECTS_ON_PAGE } from '@domain/profile/projects';

import { TODAY } from '@core/time/time';
import { SECRETS } from '@features/secrets/data/secrets.catalog';

import { PortfolioPage } from './portfolio-page';

describe('PortfolioPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: TODAY, useValue: new Date(2026, 10, 3) }],
    });
  });

  async function render(mode: 'surface' | 'xray', decorative = false): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(PortfolioPage);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('decorative', decorative);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('place chaque secret du catalogue exactement une fois', async () => {
    const element = await render('xray');
    const ids = Array.from(element.querySelectorAll('[data-secret]'), (el) => el.getAttribute('data-secret'));
    expect([...ids].sort()).toEqual(SECRETS.map((s) => s.id).sort());
  });

  it('cache les secrets aux lecteurs d’écran en surface', async () => {
    const element = await render('surface');
    const secrets = Array.from(element.querySelectorAll('[data-secret]'));
    expect(secrets.length).toBe(SECRETS.length);
    expect(secrets.every((el) => el.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('ne pose ni ancres ni interactions sur les copies affichées dans une loupe', async () => {
    expect((await render('surface')).querySelector('#parcours')).not.toBeNull();
    expect((await render('xray')).querySelector('#parcours')).not.toBeNull();
    const copy = await render('xray', true);
    expect(copy.querySelector('#parcours')).toBeNull();
    expect(copy.hasAttribute('inert')).toBe(true);
  });

  it('affiche le parcours, les projets et calcule les coulisses', async () => {
    const element = await render('xray');
    expect(element.querySelector('h1')?.textContent).toContain('Baptiste');
    expect(element.textContent).toContain('Quercy Réfrigération');
    expect(element.textContent).toContain('Argus');
    expect(element.querySelector('[data-secret="exp-quercy"]')?.textContent).toContain('J+337');
  });

  it('repère chaque section pour la loupe', async () => {
    const element = await render('surface');
    const labels = Array.from(element.querySelectorAll<HTMLElement>('[data-section]'), (el) => el.dataset['label']);
    expect(labels).toEqual(['Accueil', 'Profil', 'Parcours', 'Réalisations', 'Compétences', 'Formation', 'Contact']);
  });

  it('ne montre que les premières réalisations, les autres derrière un bouton', async () => {
    const element = await render('surface');
    expect(element.querySelectorAll('app-project-card').length).toBe(PROJECTS_ON_PAGE);
    const more = element.querySelector('.more-btn');
    expect(more?.textContent).toContain(`${PROFILE.projects.length - PROJECTS_ON_PAGE} autres projets`);
    expect(element.querySelector('app-project-card a')?.getAttribute('href')).toBe(`/projets/${PROFILE.projects[0].id}`);
  });
});
