import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PROFILE } from '@domain/profile/profile.data';
import { SECRETS } from '@features/secrets/data/secrets.catalog';
import { VIEWER_PATH } from '@features/viewer/data/viewer-state';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  it('démarre', async () => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter(routes)] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('déclare des secrets aux identifiants uniques', () => {
    const ids = SECRETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sert la démo du visualiseur 3D à l’adresse annoncée par le projet et attendue par la loupe', () => {
    const demo = PROFILE.projects.find((p) => p.id === 'visu3d')?.demo;
    expect(demo?.path).toBe(VIEWER_PATH);
    expect(routes.some((r) => `/${r.path}` === VIEWER_PATH)).toBe(true);
  });
});
