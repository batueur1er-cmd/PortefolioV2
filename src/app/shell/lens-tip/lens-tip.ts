import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, afterNextRender, effect, inject, signal } from '@angular/core';

import { safeStorage } from '@core/dom/dom';
import { WindowBus } from '@core/sync/window-bus';
import { WindowGesture } from '@shared/ui/window-gesture/window-gesture';

const SEEN_KEY = 'pv2.lens-tip';
/** Laisser le temps de découvrir seul avant de souffler la piste. */
const DELAY_MS = 45_000;

/**
 * Un indice discret, une seule fois : si personne n'a encore ouvert de loupe au bout de 45 s,
 * une petite carte montre le geste (une seconde fenêtre, rétrécie, posée dessus). Ce n'est pas
 * un bouton : la loupe reste à découvrir soi-même.
 */
@Component({
  selector: 'app-lens-tip',
  imports: [WindowGesture],
  template: `
    @if (shown()) {
      <aside class="tip" role="note" aria-label="Astuce" animate.enter="tip-enter" animate.leave="tip-leave">
        <app-window-gesture class="art" />
        <p>
          <b>Psst…</b> ouvrez ce site dans une seconde fenêtre, rétrécissez-la et posez-la ici.
        </p>
        <button type="button" (click)="dismiss()" aria-label="Fermer l'astuce">×</button>
      </aside>
    }
  `,
  styles: `
    .tip {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 41;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: min(360px, calc(100% - 36px));
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: var(--radius-l);
      background: var(--glass);
      backdrop-filter: blur(12px);
      box-shadow: var(--shadow-float);
      color: var(--ink);
      font: 400 13px/1.4 var(--sans);
    }
    .art {
      flex: none;
      width: 64px;
      height: 48px;
    }
    p {
      margin: 0;
    }
    button {
      flex: none;
      align-self: flex-start;
      border: 0;
      background: none;
      color: var(--muted);
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
    }
    .tip-enter {
      animation: tip-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .tip-leave {
      animation: tip-in 0.3s ease-in reverse;
    }
    @keyframes tip-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LensTip {
  private readonly storage = safeStorage(inject(DOCUMENT).defaultView);
  protected readonly shown = signal(false);

  constructor() {
    const bus = inject(WindowBus);
    const destroyRef = inject(DestroyRef);

    // Une loupe s'est ouverte : la piste est trouvée, on ne la soufflera plus.
    effect(() => {
      if (bus.otherLenses() > 0) this.dismiss();
    });

    afterNextRender(() => {
      if (this.seen()) return;
      const timer = setTimeout(() => {
        if (!this.seen() && bus.otherLenses() === 0) this.shown.set(true);
      }, DELAY_MS);
      destroyRef.onDestroy(() => clearTimeout(timer));
    });
  }

  protected dismiss(): void {
    this.shown.set(false);
    try {
      this.storage?.setItem(SEEN_KEY, '1');
    } catch {
      // Stockage indisponible : l'astuce pourra revenir à la prochaine visite.
    }
  }

  private seen(): boolean {
    try {
      return this.storage?.getItem(SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }
}
