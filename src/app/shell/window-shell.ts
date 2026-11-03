import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { WindowRole } from '@core/sync/window-bus';
import { WindowRoleStore } from '@features/lens/data/window-role.store';
import { LensView } from '@features/lens/lens-view';

import { MainView } from './main-view';

interface Morph {
  readonly id: number;
  readonly to: WindowRole;
}

/**
 * La racine de chaque fenêtre. Elle affiche le portfolio ou la loupe selon le rôle que la fenêtre
 * s'est découvert, et joue une transition quand ce rôle change en cours de route.
 */
@Component({
  selector: 'app-window-shell',
  imports: [MainView, LensView],
  template: `
    @switch (roles.role()) {
      @case ('main') {
        <app-main-view [initialScroll]="lastScroll" />
      }
      @case ('lens') {
        @defer (on immediate) {
          <app-lens-view />
        }
      }
      @default {
        <p class="boot">Révélateur<span>· à l'écoute des autres fenêtres</span></p>
      }
    }

    @if (morph(); as m) {
      @for (key of [m.id]; track key) {
        <div class="morph" [class]="'morph to-' + m.to" aria-hidden="true" (animationend)="morph.set(null)">
          <span>{{ m.to === 'lens' ? 'Mode loupe' : 'Mode portfolio' }}</span>
        </div>
      }
    }
    <p class="sr-only" aria-live="polite">{{ announcement() }}</p>
  `,
  styleUrl: './window-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowShell {
  protected readonly roles = inject(WindowRoleStore);
  protected readonly morph = signal<Morph | null>(null);
  protected readonly announcement = signal('');
  /** Défilement du portfolio au moment où la fenêtre est devenue loupe, pour y revenir ensuite. */
  protected lastScroll = 0;

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    const onScroll = () => {
      if (this.roles.role() === 'main' && win) this.lastScroll = win.scrollY;
    };
    win?.addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => win?.removeEventListener('scroll', onScroll));

    const title = inject(Title);
    let previous: WindowRole | null = null;
    let id = 0;
    effect(() => {
      const role = this.roles.role();
      title.setTitle(role === 'lens' ? 'Loupe — Baptiste Nodon' : 'Baptiste Nodon — Portfolio');
      if (role && previous && role !== previous) {
        this.morph.set({ id: ++id, to: role });
        this.announcement.set(
          role === 'lens'
            ? 'Cette fenêtre est devenue une loupe. Posez-la sur le portfolio.'
            : 'Cette fenêtre est redevenue le portfolio.',
        );
      }
      previous = role;
    });
  }
}
