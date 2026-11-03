import { DOCUMENT, Injectable, inject } from '@angular/core';

export type FrameCallback = (now: number, dt: number) => void;

/**
 * Une seule boucle requestAnimationFrame pour toute l'application. Les positions de fenêtre
 * n'émettent aucun événement : il faut les relire à chaque image. Les callbacks écrivent
 * directement dans le DOM et ne touchent un signal que lorsqu'une valeur affichée change,
 * pour ne pas relancer la détection de changements 60 fois par seconde.
 */
@Injectable({ providedIn: 'root' })
export class FrameLoop {
  private readonly win = inject(DOCUMENT).defaultView;
  private readonly callbacks = new Set<FrameCallback>();
  private handle = 0;
  private last = 0;

  add(callback: FrameCallback): () => void {
    this.callbacks.add(callback);
    if (!this.handle) this.start();
    return () => {
      this.callbacks.delete(callback);
      if (!this.callbacks.size) this.stop();
    };
  }

  private start(): void {
    if (!this.win?.requestAnimationFrame) return;
    this.last = performance.now();
    this.handle = this.win.requestAnimationFrame(this.tick);
  }

  private stop(): void {
    if (this.handle) this.win?.cancelAnimationFrame(this.handle);
    this.handle = 0;
  }

  private readonly tick = (now: number): void => {
    const dt = Math.min(100, now - this.last);
    this.last = now;
    for (const callback of [...this.callbacks]) {
      try {
        callback(now, dt);
      } catch (error) {
        console.error(error);
      }
    }
    this.handle = this.callbacks.size && this.win ? this.win.requestAnimationFrame(this.tick) : 0;
  };
}
