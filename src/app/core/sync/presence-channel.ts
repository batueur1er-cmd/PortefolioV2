import { signal } from '@angular/core';

export interface PresenceState {
  readonly id: string;
  /** Horodatage Date.now() de l'émetteur : toutes les fenêtres partagent l'horloge de la machine. */
  readonly t: number;
}

type Envelope<T> = { readonly kind: 'state'; readonly state: T } | { readonly kind: 'bye'; readonly id: string };

export interface PresenceOptions<T> {
  /** Délai (ms) au-delà duquel un pair muet est oublié. */
  readonly ttl?: number;
  /** Intervalle (ms) de rappel quand l'état ne change pas. */
  readonly heartbeat?: number;
  /**
   * Résumé d'un état : `roster` est recalculé quand il change. Sert à réagir quand un pair change
   * de nature (une fenêtre devient loupe) sans réagir à chaque pixel de défilement.
   */
  readonly key?: (state: T) => string;
}

/**
 * Présence partagée entre les fenêtres d'une même origine via BroadcastChannel.
 * Chaque fenêtre diffuse son état ; un état n'est renvoyé que s'il a changé, ou toutes les
 * `heartbeat` ms pour signaler qu'elle est toujours là. Un pair muet depuis `ttl` ms est oublié.
 *
 * `snapshot()` est lu à chaque image et ne déclenche rien ; `roster` est un signal qui ne change
 * que lorsqu'une fenêtre arrive, part ou change de résumé (`key`).
 */
export class PresenceChannel<T extends PresenceState> {
  private readonly channel: BroadcastChannel | null;
  private readonly peers = new Map<string, T>();
  private readonly keys = new Map<string, string>();
  private readonly rosterState = signal<readonly T[]>([]);
  readonly roster = this.rosterState.asReadonly();
  private readonly ttl: number;
  private readonly heartbeat: number;
  private readonly key: (state: T) => string;
  private lastPayload = '';
  private lastSent = 0;

  constructor(name: string, options: PresenceOptions<T> = {}) {
    this.ttl = options.ttl ?? 1500;
    this.heartbeat = options.heartbeat ?? 400;
    this.key = options.key ?? (() => '');
    this.channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(name);
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<Envelope<T>>) => this.receive(event.data);
    }
  }

  publish(state: T): void {
    if (!this.channel) return;
    const payload = JSON.stringify({ ...state, t: 0 });
    if (payload === this.lastPayload && state.t - this.lastSent < this.heartbeat) return;
    this.lastPayload = payload;
    this.lastSent = state.t;
    this.channel.postMessage({ kind: 'state', state } satisfies Envelope<T>);
  }

  snapshot(now = Date.now()): ReadonlyMap<string, T> {
    let changed = false;
    for (const [id, peer] of this.peers) {
      if (now - peer.t > this.ttl) {
        this.forget(id);
        changed = true;
      }
    }
    if (changed) this.syncRoster();
    return this.peers;
  }

  leave(id: string): void {
    this.lastPayload = '';
    this.channel?.postMessage({ kind: 'bye', id } satisfies Envelope<T>);
  }

  close(): void {
    this.channel?.close();
  }

  private receive(message: Envelope<T> | null | undefined): void {
    if (!message || typeof message !== 'object') return;
    if (message.kind === 'bye') {
      if (this.forget(message.id)) this.syncRoster();
      return;
    }
    const state = message.state;
    if (!state || typeof state.id !== 'string') return;
    const key = this.key(state);
    const changed = this.keys.get(state.id) !== key;
    this.peers.set(state.id, state);
    this.keys.set(state.id, key);
    if (changed) this.syncRoster();
  }

  private forget(id: string): boolean {
    this.keys.delete(id);
    return this.peers.delete(id);
  }

  private syncRoster(): void {
    this.rosterState.set([...this.peers.values()]);
  }
}
