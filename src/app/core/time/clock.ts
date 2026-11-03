import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * Durée commune de toutes les animations en boucle (ms). Chaque durée d'animation doit la
 * diviser (2 s, 3 s, 4 s, 5 s, 6 s, 8 s, 10 s, 12 s, 15 s, 20 s, 24 s, 30 s, 40 s, 60 s…).
 */
export const LOOP_PERIOD = 120_000;

/**
 * Retard négatif qui cale une animation CSS sur l'horloge de la machine : deux fenêtres qui
 * affichent la même animation la montrent au même instant de son cycle, même si elles ont été
 * ouvertes à des moments différents. Indispensable pour que la loupe reste alignée.
 */
export function clockDelay(now = Date.now()): string {
  return `${-(now % LOOP_PERIOD)}ms`;
}

/** L'heure qui tourne, rafraîchie à chaque seconde pile. */
@Injectable({ providedIn: 'root' })
export class Clock {
  private readonly state = signal(Date.now());
  readonly now = this.state.asReadonly();

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    if (!win) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = Date.now();
      this.state.set(now);
      timer = setTimeout(tick, 1000 - (now % 1000) + 5);
    };
    tick();
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }
}

const TIME = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** « 14:32:07 », heure de Paris. */
export function formatClock(now: number): string {
  return TIME.format(now);
}
