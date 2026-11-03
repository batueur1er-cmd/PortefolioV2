import { Directive, ElementRef, Injector, Signal, afterNextRender, effect, inject, input, signal } from '@angular/core';

import { ScrollStage, stageTop } from './scroll-stage';

/** Part de la hauteur de fenêtre à franchir avant l'apparition. */
const THRESHOLD = 0.88;

export interface RevealState {
  /** Le défilement a atteint l'élément. */
  readonly shown: Signal<boolean>;
  /** L'élément était déjà atteint au premier rendu : pas d'animation. */
  readonly instant: Signal<boolean>;
}

/**
 * Surveille le moment où le défilement de la scène atteint un élément. La règle ne dépend que du
 * défilement de la scène : une copie de la page dans une loupe réagit exactement comme l'original.
 */
export function watchReveal(element: HTMLElement): RevealState {
  const stage = inject(ScrollStage);
  const injector = inject(Injector);
  const shown = signal(false);
  const instant = signal(false);

  afterNextRender(() => {
    let top = 0;
    let measuredFor = -1;
    let first = true;
    const watcher = effect(
      () => {
        const layout = stage.layout();
        const limit = stage.scrollY() + stage.vh() * THRESHOLD;
        if (measuredFor !== layout) {
          top = stageTop(stage, element);
          measuredFor = layout;
        }
        if (top < limit) {
          instant.set(first);
          shown.set(true);
          queueMicrotask(() => watcher.destroy());
        }
        first = false;
      },
      { injector },
    );
  });

  return { shown: shown.asReadonly(), instant: instant.asReadonly() };
}

/**
 * Fait apparaître un élément quand le défilement l'atteint. Ce qui est déjà visible au premier
 * rendu apparaît sans animation. L'apparition ne touche qu'à l'opacité et aux transformations :
 * la mise en page ne bouge pas, et la loupe reste alignée.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'reveal',
    '[class.in]': 'state.shown()',
    '[class.instant]': 'state.instant()',
    '[style.--reveal-delay]': 'delay() + "ms"',
  },
})
export class RevealDirective {
  /** Retard (ms) de l'apparition, pour échelonner des éléments voisins. */
  readonly delay = input(0, { alias: 'appReveal', transform: (value: number | string) => Number(value) || 0 });

  protected readonly state = watchReveal(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement);
}
