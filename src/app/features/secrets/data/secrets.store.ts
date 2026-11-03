import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { safeStorage } from '@core/dom/dom';
import { SECRETS, SECRET_BY_ID, SECRET_IDS, SecretDef } from './secrets.catalog';
import { WindowBus } from '@core/sync/window-bus';

const STORAGE_KEY = 'pv2.secrets.found';

export interface FoundEvent {
  readonly def: SecretDef;
  /** Vrai si le secret a été trouvé dans une autre fenêtre. */
  readonly remote: boolean;
  readonly seq: number;
}

/**
 * Secrets découverts, communs à toutes les fenêtres : enregistrés dans localStorage
 * et diffusés sur le bus pour que chaque fenêtre se mette à jour immédiatement.
 */
@Injectable({ providedIn: 'root' })
export class SecretsStore {
  private readonly bus = inject(WindowBus);
  private readonly storage = safeStorage(inject(DOCUMENT).defaultView);

  readonly catalog = SECRETS;
  readonly total = SECRETS.length;

  private readonly foundIds = signal<ReadonlySet<string>>(this.load());
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
    });
  }

  markFound(id: string): void {
    if (!SECRET_IDS.has(id) || this.foundIds().has(id)) return;
    this.merge([id], false);
    this.bus.send({ type: 'found', ids: [id] });
  }

  reset(): void {
    this.foundIds.set(new Set());
    this.save();
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
    // La fenêtre qui a trouvé le secret l'a déjà enregistré : le stockage est partagé.
    if (!remote) this.save();
    this.lastEvent.set({ def: last, remote, seq: ++this.seq });
  }

  private load(): ReadonlySet<string> {
    try {
      const raw: unknown = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? '[]');
      return new Set(Array.isArray(raw) ? raw.filter((id): id is string => SECRET_IDS.has(String(id))) : []);
    } catch {
      return new Set();
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify([...this.foundIds()]));
    } catch {
      // Stockage indisponible (navigation privée stricte) : la partie dure le temps de la session.
    }
  }
}
