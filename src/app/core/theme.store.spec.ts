import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ThemeStore } from './theme.store';
import { DEFAULT_THEME, THEMES, isThemeId } from './themes';

describe('ThemeStore', () => {
  it('reconnaît uniquement les thèmes déclarés', () => {
    expect(isThemeId('nuit')).toBe(true);
    expect(isThemeId('inconnu')).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it('applique le thème sur <html>', () => {
    const store = TestBed.inject(ThemeStore);
    const root = TestBed.inject(DOCUMENT).documentElement;
    store.set(DEFAULT_THEME);
    TestBed.tick();
    expect(root.dataset['theme']).toBeUndefined();

    store.set('nuit');
    TestBed.tick();
    expect(root.dataset['theme']).toBe('nuit');
  });

  it('fait le tour des thèmes', () => {
    const store = TestBed.inject(ThemeStore);
    const start = store.theme();
    store.next();
    expect(store.theme()).not.toBe(start);
    for (let i = 1; i < THEMES.length; i++) store.next();
    expect(store.theme()).toBe(start);
  });
});
