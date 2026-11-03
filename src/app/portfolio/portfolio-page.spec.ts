import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SECRETS } from '../core/secrets.catalog';
import { TODAY } from '../core/time';
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

  it('ne pose pas d’ancres sur les copies affichées dans une loupe', async () => {
    expect((await render('surface')).querySelector('#parcours')).not.toBeNull();
    expect((await render('xray')).querySelector('#parcours')).not.toBeNull();
    expect((await render('xray', true)).querySelector('#parcours')).toBeNull();
  });

  it('affiche le parcours et calcule les coulisses', async () => {
    const element = await render('xray');
    expect(element.querySelector('h1')?.textContent).toContain('Baptiste');
    expect(element.textContent).toContain('Quercy Réfrigération');
    expect(element.querySelector('[data-secret="exp-quercy"]')?.textContent).toContain('J+337');
  });
});
