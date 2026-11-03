import { Signal } from '@angular/core';

export type RevealMode = 'surface' | 'xray';

/**
 * Ce que la fonctionnalité secrets attend de la page qui les affiche. La page fournit ce jeton :
 * les secrets ne dépendent pas de la page, c'est la page qui dépend d'eux.
 * Une même fenêtre peut afficher deux exemplaires de la page (surface + loupe de poche) :
 * chacun a son propre registre.
 */
export abstract class SecretHost {
  abstract readonly mode: Signal<RevealMode>;
  abstract register(id: string, element: Element): void;
  abstract unregister(id: string, element: Element): void;
}
