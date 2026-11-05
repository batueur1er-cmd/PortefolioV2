import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { WindowBus } from '../sync/window-bus';
import { safeStorage } from './dom';

const STORAGE_KEY = 'pv2.simple';

/**
 * « Version simple » : une lecture rapide, sans effets, choisie par le visiteur (et mémorisée).
 * Elle s'ajoute à `prefers-reduced-motion` : tout ce qui bouge demande `reduced()`.
 * La classe `simple` sur `<html>` coupe les animations CSS ; `?simple=1` la force sans l'enregistrer.
 */
@Injectable({ providedIn: 'root' })
export class MotionPreference {
  private readonly bus = inject(WindowBus);
  private readonly document = inject(DOCUMENT);
  private readonly storage = safeStorage(this.document.defaultView);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;

  private readonly simpleState = signal(this.initial());
  readonly simple = this.simpleState.asReadonly();

  constructor() {
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'simple') this.simpleState.set(command.on);
    });
    effect(() => this.document.documentElement.classList.toggle('simple', this.simpleState()));
  }

  /** Vrai quand il ne faut rien animer : version simple, ou réglage du système. */
  reduced(): boolean {
    return this.simpleState() || !!this.media?.matches;
  }

  set(on: boolean): void {
    if (on === this.simpleState()) return;
    this.simpleState.set(on);
    try {
      this.storage?.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {
      // Stockage indisponible : le choix dure le temps de la session.
    }
    this.bus.send({ type: 'simple', on });
  }

  toggle(): void {
    this.set(!this.simpleState());
  }

  private initial(): boolean {
    const forced = new URLSearchParams(this.document.location.search).get('simple');
    if (forced !== null) return forced !== '0';
    try {
      return this.storage?.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}
