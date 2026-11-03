import { Signal } from '@angular/core';

import { RevealMode } from '@features/secrets/secret-host';

export type PageMode = RevealMode;

/** Ce que chaque section sait de l'exemplaire de page qui l'affiche. */
export abstract class PageContext {
  abstract readonly mode: Signal<PageMode>;
  /** Copie affichée dans une loupe : ni ancres, ni interactions. */
  abstract readonly decorative: Signal<boolean>;
  /** Identifiant d'ancre, posé uniquement sur l'exemplaire principal pour éviter les doublons. */
  abstract anchor(name: string): string | null;
}
