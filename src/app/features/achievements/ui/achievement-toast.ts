import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';

import { AchievementDef } from '../data/achievements.catalog';
import { AchievementsStore } from '../data/achievements.store';

/** Annonce un succès qui vient d'être débloqué, en haut de l'écran. */
@Component({
  selector: 'app-achievement-toast',
  template: `
    <div class="region" role="status" aria-live="polite">
      @if (shown(); as def) {
        <div class="card" animate.enter="ach-enter" animate.leave="ach-leave">
          <span class="badge" aria-hidden="true">★</span>
          <span class="body">
            <span class="kicker">Succès débloqué · {{ count() }}/{{ store.total }}</span>
            <b>{{ def.label }}</b>
            <span class="hint">{{ def.hint }}</span>
          </span>
        </div>
      }
    </div>
  `,
  styles: `
    .region {
      position: fixed;
      top: 16px;
      left: 50%;
      z-index: 60;
      transform: translateX(-50%);
      pointer-events: none;
    }
    .card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 18px 12px 12px;
      border-radius: var(--radius-l);
      background: color-mix(in srgb, var(--ink) 92%, transparent);
      color: var(--paper);
      box-shadow: var(--shadow-float);
      backdrop-filter: blur(10px);
    }
    .badge {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: var(--on-accent);
      font-size: 18px;
    }
    .body {
      display: grid;
      gap: 2px;
      font: 400 13px/1.35 var(--sans);
    }
    .kicker {
      font: 500 10px/1.3 var(--mono);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--paper) 70%, transparent);
    }
    .hint {
      color: color-mix(in srgb, var(--paper) 75%, transparent);
    }
    .ach-enter {
      animation: ach-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.2);
    }
    .ach-leave {
      animation: ach-in 0.3s ease-in reverse;
    }
    @keyframes ach-in {
      from {
        opacity: 0;
        transform: translateY(-24px) scale(0.96);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementToast {
  protected readonly store = inject(AchievementsStore);
  protected readonly shown = signal<AchievementDef | null>(null);
  protected readonly count = signal(0);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    effect(() => {
      const event = this.store.lastUnlocked();
      if (!event) return;
      this.count.set(untracked(this.store.count));
      this.shown.set(event.def);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.shown.set(null), 4500);
    });
  }
}
