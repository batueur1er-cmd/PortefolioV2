import { signal } from '@angular/core';

export interface PresenceState {
  readonly id: string;
  /** Horodatage Date.now() de l'émetteur : toutes les fenêtres partagent l'horloge de la machine. */
  readonly t: number;
}

type Envelope<T> = { readonly kind: 'state'; readonly state: T } | { readonly kind: 'bye'; readonly id: string };

/**
 * Présence partagée entre les fenêtres d'une même origine via BroadcastChannel.
 * Chaque fenêtre diffuse son état ; un état n'est renvoyé que s'il a changé, ou toutes les
 * `heartbeat` ms pour signaler qu'elle est toujours là. Un pair muet depuis `ttl` ms est oublié.
 *
 * `snapshot()` est lu à chaque image et ne déclenche rien ; `roster` est un signal qui ne change
 * que lorsqu'une fenêtre arrive ou part.
 */
export class PresenceChannel<T extends PresenceState> {
  private readonly channel: BroadcastChannel | null;
  private readonly peers = new Map<string, T>();
  private readonly rosterState = signal<readonly T[]>([]);
  readonly roster = this.rosterState.asReadonly();
  private lastPayload = '';
  private lastSent = 0;

  constructor(
    name: string,
    private readonly ttl = 1500,
    private readonly heartbeat = 400,
  ) {
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
        this.peers.delete(id);
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
      if (this.peers.delete(message.id)) this.syncRoster();
      return;
    }
    const state = message.state;
    if (!state || typeof state.id !== 'string') return;
    const isNew = !this.peers.has(state.id);
    this.peers.set(state.id, state);
    if (isNew) this.syncRoster();
  }

  private syncRoster(): void {
    this.rosterState.set([...this.peers.values()]);
  }
}
