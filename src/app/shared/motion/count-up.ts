import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, computed, effect, inject, input, signal } from '@angular/core';

import { watchReveal } from './reveal.directive';

/**
 * Un nombre qui défile jusqu'à sa valeur quand il apparaît. La largeur est réservée dès le départ
 * (chiffres à chasse fixe) : le compteur ne pousse jamais la mise en page.
 */
@Component({
  selector: 'app-count-up',
  template: `{{ display() }}`,
  styles: `
    :host {
      display: inline-block;
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.min-width.ch]': 'width()' },
})
export class CountUp {
  readonly value = input.required<number>();
  /** Durée du défilement, en ms. */
  readonly duration = input(1400);

  private readonly reveal = watchReveal(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement);
  private readonly win = inject(DOCUMENT).defaultView;
  private readonly current = signal<number | null>(0);
  protected readonly width = computed(() => String(this.value()).length);
  protected readonly display = computed(() => this.current() ?? this.value());

  constructor() {
    effect((onCleanup) => {
      const target = this.value();
      if (!this.reveal.shown()) {
        this.current.set(0);
        return;
      }
      const win = this.win;
      if (this.reveal.instant() || !win || win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.current.set(null);
        return;
      }
      const start = performance.now();
      let frame = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / this.duration());
        this.current.set(t >= 1 ? null : Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = win.requestAnimationFrame(tick);
      };
      frame = win.requestAnimationFrame(tick);
      onCleanup(() => win.cancelAnimationFrame(frame));
    });
  }
}
