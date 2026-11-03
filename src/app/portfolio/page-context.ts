import { Signal } from '@angular/core';

export type PageMode = 'surface' | 'xray';

/**
 * Ce que chaque section sait de l'exemplaire de page qui l'affiche. Une même fenêtre peut
 * afficher deux exemplaires (surface + loupe intégrée) : chacun a son propre registre de secrets.
 */
export abstract class PageContext {
  abstract readonly mode: Signal<PageMode>;
  abstract register(id: string, element: Element): void;
  abstract unregister(id: string, element: Element): void;
  /** Identifiant d'ancre, posé uniquement sur l'exemplaire principal pour éviter les doublons. */
  abstract anchor(name: string): string | null;
}
