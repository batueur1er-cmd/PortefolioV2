import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';

import { Size } from '@core/geometry/geometry';
import { WindowBus, WindowPresence, WindowRole } from '@core/sync/window-bus';
import { isLensSized } from '@core/sync/window-size';

/** Délai (ms) de stabilité avant de changer de rôle : on ne bascule pas en plein redimensionnement. */
const SETTLE_MS = 280;
/** Écoute (ms) d'une petite fenêtre qui démarre, le temps d'entendre les autres (> 1 battement). */
const LISTEN_MS = 450;

/**
 * La règle : une fenêtre est une loupe si elle est petite et qu'une grande fenêtre du site est
 * ouverte. Deux petites fenêtres seules restent deux portfolios ; un téléphone aussi.
 */
export function decideRole(small: boolean, peers: readonly WindowPresence[]): WindowRole {
  return small && peers.some((peer) => !peer.small) ? 'lens' : 'main';
}

/** `?loupe` ou `?portfolio` dans l'URL imposent un rôle (démonstration, tests). */
export function forcedRole(search: string): WindowRole | null {
  const params = new URLSearchParams(search);
  if (params.has('loupe')) return 'lens';
  if (params.has('portfolio')) return 'main';
  return null;
}

/**
 * Le rôle de cette fenêtre, déduit de sa taille et des autres fenêtres ouvertes. Aucun bouton :
 * rétrécir une fenêtre au-dessus d'une autre suffit à en faire une loupe, l'agrandir la rend au
 * portfolio.
 */
@Injectable({ providedIn: 'root' })
export class WindowRoleStore {
  private readonly bus = inject(WindowBus);
  private readonly doc = inject(DOCUMENT);
  private readonly win = this.doc.defaultView;
  readonly forced = forcedRole(this.doc.location.search);

  private readonly viewportState = signal<Size>(this.measure());
  readonly viewport = this.viewportState.asReadonly();
  private readonly smallState = signal(isLensSized(this.viewportState()));
  /** Assez petite pour servir de loupe. */
  readonly small = this.smallState.asReadonly();

  /** Le rôle que la situation demande, avant stabilisation. */
  private readonly wanted = computed(() => this.forced ?? decideRole(this.small(), this.bus.windows.roster()));

  private readonly roleState = signal<WindowRole | null>(this.forced ?? (this.smallState() ? null : 'main'));
  /** Rôle de la fenêtre ; null tant qu'une petite fenêtre écoute encore les autres. */
  readonly role = this.roleState.asReadonly();

  constructor() {
    const win = this.win;
    const onResize = () => {
      const viewport = this.measure();
      const current = this.viewportState();
      if (viewport.w === current.w && viewport.h === current.h) return;
      this.viewportState.set(viewport);
      this.smallState.set(isLensSized(viewport, this.smallState()));
    };
    win?.addEventListener('resize', onResize);

    // Une petite fenêtre ne sait pas encore si une grande est ouverte : elle écoute d'abord.
    const listen = this.roleState() === null ? setTimeout(() => this.roleState.set(this.wanted()), LISTEN_MS) : undefined;
    // Toutes les 500 ms : on oublie les pairs disparus sans prévenir, et on remesure la fenêtre,
    // au cas où elle aurait changé de taille avant que l'écouteur ne soit posé.
    const prune = setInterval(() => {
      onResize();
      this.bus.windows.snapshot();
    }, 500);

    effect((onCleanup) => {
      const wanted = this.wanted();
      const current = this.roleState();
      if (current === null || wanted === current) return;
      const timer = setTimeout(() => this.roleState.set(wanted), SETTLE_MS);
      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      const role = this.roleState();
      if (role) this.bus.role.set(role);
    });

    inject(DestroyRef).onDestroy(() => {
      win?.removeEventListener('resize', onResize);
      clearTimeout(listen);
      clearInterval(prune);
    });
  }

  private measure(): Size {
    return { w: this.win?.innerWidth ?? 1280, h: this.win?.innerHeight ?? 800 };
  }
}
