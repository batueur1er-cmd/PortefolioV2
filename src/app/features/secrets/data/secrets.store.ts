import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SECRETS, SECRET_BY_ID, SECRET_IDS, SecretDef } from './secrets.catalog';
import { WindowBus } from '@core/sync/window-bus';

export interface FoundEvent {
  readonly def: SecretDef;
  /** Vrai si le secret a été trouvé dans une autre fenêtre. */
  readonly remote: boolean;
  readonly seq: number;
}

/**
 * Secrets découverts, communs à toutes les fenêtres ouvertes, mais jamais enregistrés : recharger
 * la page relance la chasse. Ils passent par le bus : une fenêtre qui s'ouvre (la loupe) récupère
 * ceux des autres, une fenêtre rechargée remet tout le monde à zéro.
 */
@Injectable({ providedIn: 'root' })
export class SecretsStore {
  private readonly bus = inject(WindowBus);
  private readonly win = inject(DOCUMENT).defaultView;

  readonly catalog = SECRETS;
  readonly total = SECRETS.length;

  private readonly foundIds = signal<ReadonlySet<string>>(new Set());
  readonly found = this.foundIds.asReadonly();
  readonly count = computed(() => this.foundIds().size);
  readonly progress = computed(() => this.count() / this.total);
  readonly complete = computed(() => this.count() >= this.total);

  private readonly lastEvent = signal<FoundEvent | null>(null);
  readonly lastFound = this.lastEvent.asReadonly();
  private seq = 0;

  constructor() {
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'found') this.merge(command.ids, true);
      else if (command.type === 'reset') this.foundIds.set(new Set());
      else if (command.type === 'secrets-sync' && this.count()) {
        this.bus.send({ type: 'found', ids: [...this.foundIds()] });
      }
    });

    // Rechargée : la chasse repart de zéro, pour toutes les fenêtres. Nouvelle fenêtre : elle
    // demande où en sont les autres.
    if (this.isReload()) this.bus.send({ type: 'reset' });
    else this.bus.send({ type: 'secrets-sync' });
  }

  private isReload(): boolean {
    const entry = this.win?.performance?.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
    return entry?.type === 'reload';
  }

  markFound(id: string): void {
    if (!SECRET_IDS.has(id) || this.foundIds().has(id)) return;
    this.merge([id], false);
    this.bus.send({ type: 'found', ids: [id] });
  }

  reset(): void {
    this.foundIds.set(new Set());
    this.bus.send({ type: 'reset' });
  }

  private merge(ids: readonly string[], remote: boolean): void {
    const next = new Set(this.foundIds());
    let last: SecretDef | undefined;
    for (const id of ids) {
      if (!SECRET_IDS.has(id) || next.has(id)) continue;
      next.add(id);
      last = SECRET_BY_ID.get(id);
    }
    if (!last) return;
    this.foundIds.set(next);
    this.lastEvent.set({ def: last, remote, seq: ++this.seq });
  }
}
