import { DestroyRef } from '@angular/core';

import { Point } from './geometry';

/** Appelle `callback` tout de suite, puis à chaque changement de taille des éléments observés. */
export function observeResize(targets: readonly Element[], callback: () => void, destroyRef: DestroyRef): void {
  callback();
  if (typeof ResizeObserver === 'undefined') return;
  const observer = new ResizeObserver(() => callback());
  targets.forEach((target) => observer.observe(target));
  destroyRef.onDestroy(() => observer.disconnect());
}

/** Les polices changent la largeur des textes : on remesure une fois qu'elles sont chargées. */
export function whenFontsReady(doc: Document, callback: () => void): void {
  const fonts: FontFaceSet | undefined = doc.fonts;
  void fonts?.ready.then(() => callback());
}

/**
 * Position d'un élément relativement à un ancêtre positionné, en coordonnées de mise en page.
 * Contrairement à getBoundingClientRect, le résultat ignore les transformations CSS :
 * il reste juste quand la page est zoomée dans la loupe.
 */
export function offsetWithin(element: HTMLElement, ancestor: HTMLElement): Point {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}
