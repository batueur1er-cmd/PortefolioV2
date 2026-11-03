import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';

import { SecretsStore } from '../data/secrets.store';

/** Annonce les secrets trouvés (ici ou dans une loupe) et les messages ponctuels. */
@Component({
  selector: 'app-found-toast',
  template: `
    <div class="region" role="status" aria-live="polite">
      @if (message(); as text) {
        <p class="toast" animate.enter="toast-enter" animate.leave="toast-leave">
          <span class="spark" aria-hidden="true">✦</span>{{ text }}
        </p>
      }
    </div>
  `,
  styleUrl: './found-toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundToast {
  readonly notice = input<string | null>(null);

  private readonly store = inject(SecretsStore);
  protected readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    effect(() => {
      const event = this.store.lastFound();
      if (!event) return;
      const count = untracked(this.store.count);
      const who = event.remote ? 'La loupe a trouvé' : 'Secret trouvé';
      this.show(`${who} — ${event.def.label} · ${count}/${this.store.total}`, 3200);
    });
    effect(() => {
      const notice = this.notice();
      if (notice) this.show(notice, 4200);
    });
  }

  /** Un seul minuteur : un nouveau message remplace le précédent et repart pour sa propre durée. */
  private show(text: string, duration: number): void {
    this.message.set(text);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), duration);
  }
}
