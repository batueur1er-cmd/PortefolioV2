import { Injectable } from '@angular/core';

import { DoomPresence } from '@core/sync/window-bus';

/**
 * L'état de la démo affichée par cette fenêtre, que le shell joint à la présence de la fenêtre :
 * une loupe posée dessus le reçoit à chaque image et redessine la même vue. Tout le reste (le
 * niveau, son arbre BSP, les textures) se recalcule à l'identique dans chaque fenêtre.
 */
@Injectable({ providedIn: 'root' })
export class DoomSession {
  private state: DoomPresence | null = null;

  publish(state: DoomPresence | null): void {
    this.state = state;
  }

  snapshot(): DoomPresence | null {
    return this.state;
  }
}
