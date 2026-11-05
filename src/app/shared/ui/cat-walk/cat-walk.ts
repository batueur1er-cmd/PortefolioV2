import { ChangeDetectionStrategy, Component, DestroyRef, Injectable, afterNextRender, inject, signal } from '@angular/core';

import { MotionPreference } from '@core/dom/motion-preference';

/** Demande une traversée du chat (commande « chat » du terminal, ou de temps en temps). */
@Injectable({ providedIn: 'root' })
export class CatWalk {
  private readonly runs = signal(0);
  readonly walks = this.runs.asReadonly();

  summon(): void {
    this.runs.update((n) => n + 1);
  }
}

/** Toutes les 3 minutes environ, un chat traverse le bas de l'écran. */
const EVERY_MS = 180_000;

/**
 * Le chat de la maison, en silhouette : il traverse le bas de la fenêtre puis disparaît.
 * Posé en position fixe par-dessus la page, il ne touche pas à la mise en page.
 */
@Component({
  selector: 'app-cat-walk',
  template: `
    @for (run of [cat.walks()]; track run) {
      @if (run > 0) {
        <svg class="cat" viewBox="0 0 120 70" aria-hidden="true" (animationend)="done.set(run)" [class.gone]="done() === run">
          <g class="body">
            <path d="M14 46c0-12 12-20 32-20h30c10 0 16-6 20-12l4-8 4 9 6-5-1 12c3 4 4 9 2 14-2 6-8 9-15 9H34c-10 0-20-6-20 1z" />
            <path class="tail" d="M16 44c-8-2-12-10-8-18 2-4 6-5 8-3-4 2-5 7-2 11 2 3 5 4 6 6z" />
            <rect class="leg a" x="30" y="52" width="6" height="14" rx="3" />
            <rect class="leg b" x="44" y="52" width="6" height="14" rx="3" />
            <rect class="leg a" x="74" y="52" width="6" height="14" rx="3" />
            <rect class="leg b" x="88" y="52" width="6" height="14" rx="3" />
          </g>
          <circle class="eye" cx="104" cy="24" r="1.8" />
        </svg>
      }
    }
  `,
  styles: `
    :host {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 0;
      z-index: 38;
      pointer-events: none;
    }
    .cat {
      position: absolute;
      bottom: 6px;
      left: 0;
      width: 96px;
      height: 56px;
      fill: var(--ink);
      animation: cat-walk 14s linear forwards;
    }
    .cat.gone {
      display: none;
    }
    .eye {
      fill: var(--xn);
    }
    .leg {
      transform-box: fill-box;
      transform-origin: top center;
      animation: cat-step 0.5s ease-in-out infinite alternate;
    }
    .leg.b {
      animation-direction: alternate-reverse;
    }
    .tail {
      transform-box: fill-box;
      transform-origin: right bottom;
      animation: cat-tail 1s ease-in-out infinite alternate;
    }
    @keyframes cat-walk {
      from {
        transform: translateX(-120px);
      }
      to {
        transform: translateX(calc(100vw + 20px));
      }
    }
    @keyframes cat-step {
      from {
        transform: rotate(-18deg);
      }
      to {
        transform: rotate(18deg);
      }
    }
    @keyframes cat-tail {
      to {
        transform: rotate(14deg);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatWalkLayer {
  protected readonly cat = inject(CatWalk);
  protected readonly done = signal(0);

  constructor() {
    const motion = inject(MotionPreference);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const timer = setInterval(() => {
        if (!motion.reduced()) this.cat.summon();
      }, EVERY_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }
}
