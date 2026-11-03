import { Signal } from '@angular/core';

import { offsetWithin } from '@core/dom/dom';

/**
 * La scène que font défiler les animations liées au défilement. Une page affichée dans une loupe
 * ne défile pas elle-même : elle reçoit le défilement de la fenêtre qu'elle survole. En lisant
 * `scrollY` ici plutôt que sur `window`, les deux exemplaires de la page restent identiques.
 */
export abstract class ScrollStage {
  /** Défilement vertical (px) de la fenêtre qui fait défiler cette page. */
  abstract readonly scrollY: Signal<number>;
  /** Hauteur (px) de cette fenêtre. */
  abstract readonly vh: Signal<number>;
  /** Change quand la mise en page bouge : les positions mesurées sont à refaire. */
  abstract readonly layout: Signal<number>;
  /** L'élément racine de la page ; les positions sont mesurées par rapport à lui. */
  abstract readonly element: HTMLElement;
}

/** Position verticale d'un élément dans la page, sans tenir compte des transformations. */
export function stageTop(stage: ScrollStage, element: HTMLElement): number {
  return offsetWithin(element, stage.element).y;
}
