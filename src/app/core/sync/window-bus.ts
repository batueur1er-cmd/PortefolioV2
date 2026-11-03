import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { Point, Size } from '../geometry/geometry';
import { PresenceChannel, PresenceState } from './presence-channel';

export type WindowRole = 'main' | 'lens';

/** Ce que toute fenêtre annonce, quel que soit son rôle. */
interface WindowBase extends PresenceState {
  /** Coin haut gauche du contenu, en coordonnées écran. */
  readonly origin: Point;
  /** Taille du contenu (innerWidth × innerHeight). */
  readonly viewport: Size;
  /** Assez petite pour servir de loupe (voir `isLensSized`). */
  readonly small: boolean;
}

/** Une fenêtre qui affiche le portfolio. */
export interface MainPresence extends WindowBase {
  readonly kind: 'main';
  /** Largeur de mise en page (sans la barre de défilement) : la loupe s'y cale. */
  readonly layoutWidth: number;
  readonly scroll: Point;
}

/** Une fenêtre loupe. */
export interface LensPresence extends WindowBase {
  readonly kind: 'lens';
  readonly zoom: number;
  /** Fenêtre portfolio actuellement sous la loupe. */
  readonly target: string | null;
  /** Section du portfolio sous le réticule. */
  readonly section: string | null;
}

export type WindowPresence = MainPresence | LensPresence;

/** Un trou noir du mode singularité, centré sur sa fenêtre (coordonnées écran). */
export interface HolePresence extends PresenceState {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly hue: number;
  readonly rot: number;
  readonly spin: number;
}

export type BusCommand =
  | { readonly type: 'scroll'; readonly target: string; readonly dy: number }
  | { readonly type: 'found'; readonly ids: readonly string[] }
  | { readonly type: 'reset' }
  | { readonly type: 'singularity'; readonly open: boolean }
  | { readonly type: 'theme'; readonly id: string };

export const isMain = (p: WindowPresence): p is MainPresence => p.kind === 'main';
export const isLens = (p: WindowPresence): p is LensPresence => p.kind === 'lens';

/** Le bus qui relie toutes les fenêtres ouvertes sur le site. */
@Injectable({ providedIn: 'root' })
export class WindowBus {
  readonly id = createId();
  /** Rôle actuel de cette fenêtre, tenu à jour par la fonctionnalité loupe. */
  readonly role = signal<WindowRole>('main');
  readonly windows = new PresenceChannel<WindowPresence>('pv2:windows', {
    // Le roster ne bouge que si une fenêtre change de rôle, de taille ou de cible.
    key: (p) => (isLens(p) ? `lens:${p.small}:${p.target}` : `main:${p.small}`),
  });
  readonly holes = new PresenceChannel<HolePresence>('pv2:holes');

  /** Autres fenêtres, par rôle. */
  readonly otherMains = computed(() => this.windows.roster().filter(isMain).length);
  readonly otherLenses = computed(() => this.windows.roster().filter(isLens).length);

  private readonly commandChannel =
    typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('pv2:commands');
  private readonly commandStream = new Subject<BusCommand>();
  readonly commands$ = this.commandStream.asObservable();

  constructor() {
    if (this.commandChannel) {
      this.commandChannel.onmessage = (event: MessageEvent<BusCommand>) => this.commandStream.next(event.data);
    }
    const win = inject(DOCUMENT).defaultView;
    const leave = () => {
      this.windows.leave(this.id);
      this.holes.leave(this.id);
    };
    win?.addEventListener('pagehide', leave);
    inject(DestroyRef).onDestroy(() => {
      win?.removeEventListener('pagehide', leave);
      leave();
      this.windows.close();
      this.holes.close();
      this.commandChannel?.close();
      this.commandStream.complete();
    });
  }

  send(command: BusCommand): void {
    this.commandChannel?.postMessage(command);
  }
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}
