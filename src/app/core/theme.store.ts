import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { safeStorage } from './dom';
import { DEFAULT_THEME, THEMES, ThemeDef, ThemeId, isThemeId } from './themes';
import { WindowBus } from './window-bus';

const STORAGE_KEY = 'pv2.theme';

/**
 * Le thème actif, commun à toutes les fenêtres : la loupe doit afficher la même palette que le
 * portfolio qu'elle survole. `?theme=nuit` dans l'URL force un thème sans l'enregistrer.
 */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly bus = inject(WindowBus);
  private readonly document = inject(DOCUMENT);
  private readonly storage = safeStorage(this.document.defaultView);

  readonly themes: readonly ThemeDef[] = THEMES;

  private readonly current = signal<ThemeId>(this.initial());
  readonly theme = this.current.asReadonly();
  readonly def = computed(() => THEMES.find((t) => t.id === this.current()) ?? THEMES[0]);

  constructor() {
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'theme' && isThemeId(command.id)) this.current.set(command.id);
    });
    effect(() => this.apply(this.current()));
  }

  set(id: ThemeId): void {
    if (id === this.current()) return;
    this.current.set(id);
    try {
      this.storage?.setItem(STORAGE_KEY, id);
    } catch {
      // Stockage indisponible : le thème dure le temps de la session.
    }
    this.bus.send({ type: 'theme', id });
  }

  /** Passe au thème suivant de la liste. */
  next(): void {
    const index = THEMES.findIndex((t) => t.id === this.current());
    this.set(THEMES[(index + 1) % THEMES.length].id);
  }

  private initial(): ThemeId {
    const forced = new URLSearchParams(this.document.location.search).get('theme');
    if (isThemeId(forced)) return forced;
    try {
      const saved = this.storage?.getItem(STORAGE_KEY);
      if (isThemeId(saved)) return saved;
    } catch {
      // Ignoré : on retombe sur le thème par défaut.
    }
    return DEFAULT_THEME;
  }

  private apply(id: ThemeId): void {
    const root = this.document.documentElement;
    if (id === DEFAULT_THEME) delete root.dataset['theme'];
    else root.dataset['theme'] = id;
    // La barre d'adresse mobile prend la couleur de fond du thème.
    const paper = this.document.defaultView?.getComputedStyle(root).getPropertyValue('--paper').trim();
    if (paper) this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', paper);
  }
}
