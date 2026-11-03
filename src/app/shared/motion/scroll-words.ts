import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';

import { ScrollStage, stageTop } from './scroll-stage';

/**
 * Un texte dont les mots s'allument au fil du défilement. L'avancement ne dépend que du
 * défilement de la scène : la copie rayons X allume les mêmes mots.
 */
@Component({
  selector: 'app-scroll-words',
  template: `
    <span class="sr-only">{{ text() }}</span>
    <span aria-hidden="true">
      @for (word of words(); track $index) {
        <span class="word" [class.lit]="$index < lit()">{{ word }}</span>{{ ' ' }}
      }
    </span>
  `,
  styles: `
    .word {
      opacity: 0.18;
      transition: opacity 0.35s ease;
    }
    .word.lit {
      opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
      .word {
        opacity: 1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollWords {
  readonly text = input.required<string>();

  private readonly stage = inject(ScrollStage);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly words = computed(() => this.text().split(/\s+/));

  private readonly box = computed(() => {
    this.stage.layout();
    return { top: stageTop(this.stage, this.element), height: this.element.offsetHeight };
  });

  /** Nombre de mots allumés : tout commence aux trois quarts de l'écran, tout finit au tiers. */
  protected readonly lit = computed(() => {
    const { top, height } = this.box();
    const vh = this.stage.vh();
    const start = top - vh * 0.75;
    const end = top + height - vh * 0.35;
    const t = (this.stage.scrollY() - start) / Math.max(1, end - start);
    return Math.round(Math.min(1, Math.max(0, t)) * this.words().length);
  });
}
