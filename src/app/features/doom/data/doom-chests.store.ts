import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { safeStorage } from '@core/dom/dom';
import { WindowBus } from '@core/sync/window-bus';
import { AchievementsStore } from '@features/achievements/data/achievements.store';

import { DOOM_CHESTS } from './doom-state';

const STORAGE_KEY = 'pv2.doom-chests';

/** Les coffres cachés déjà repérés à la loupe, gardés d'une visite à l'autre et partagés entre les fenêtres. */
@Injectable({ providedIn: 'root' })
export class DoomChestsStore {
  private readonly bus = inject(WindowBus);
  private readonly achievements = inject(AchievementsStore);
  private readonly storage = safeStorage(inject(DOCUMENT).defaultView);

  readonly total = DOOM_CHESTS;
  private readonly ids = signal<ReadonlySet<string>>(this.read());
  readonly found = this.ids.asReadonly();
  readonly count = computed(() => this.ids().size);

  constructor() {
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'doom-chest') this.add(command.id);
      else if (command.type === 'achievements-reset') this.write(new Set());
    });
  }

  markFound(id: string): void {
    if (!this.add(id)) return;
    this.bus.send({ type: 'doom-chest', id });
    if (this.count() === this.total) this.achievements.unlock('coffres-caches');
  }

  private add(id: string): boolean {
    if (this.ids().has(id)) return false;
    this.write(new Set([...this.ids(), id]));
    return true;
  }

  private read(): Set<string> {
    try {
      const list: unknown = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? '[]');
      return new Set(Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private write(ids: ReadonlySet<string>): void {
    this.ids.set(ids);
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // Stockage indisponible : les coffres durent le temps de la visite.
    }
  }
}
