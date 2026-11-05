import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { safeStorage } from '@core/dom/dom';
import { WindowBus } from '@core/sync/window-bus';

import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, AchievementDef, EXPLORER_PAGES } from './achievements.catalog';

const STORAGE_KEY = 'pv2.achievements';
const VISITED_KEY = 'pv2.projects-seen';

export interface UnlockEvent {
  readonly def: AchievementDef;
  readonly seq: number;
}

/**
 * Les succès débloqués, gardés dans le navigateur (contrairement aux secrets, qui repartent de zéro
 * à chaque rechargement) et partagés entre les fenêtres ouvertes.
 */
@Injectable({ providedIn: 'root' })
export class AchievementsStore {
  private readonly bus = inject(WindowBus);
  private readonly storage = safeStorage(inject(DOCUMENT).defaultView);

  readonly catalog = ACHIEVEMENTS;
  readonly total = ACHIEVEMENTS.length;

  private readonly unlockedIds = signal<ReadonlySet<string>>(this.read(STORAGE_KEY));
  readonly unlocked = this.unlockedIds.asReadonly();
  readonly count = computed(() => this.unlockedIds().size);

  private readonly lastEvent = signal<UnlockEvent | null>(null);
  readonly lastUnlocked = this.lastEvent.asReadonly();
  private seq = 0;

  constructor() {
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'achievement') this.add(command.id, false);
    });
  }

  unlock(id: string): void {
    this.add(id, true);
  }

  /** Note la visite d'une page projet ; la troisième différente débloque « Explorateur ». */
  visitProject(id: string): void {
    const seen = this.read(VISITED_KEY);
    if (seen.has(id)) return;
    seen.add(id);
    this.write(VISITED_KEY, seen);
    if (seen.size >= EXPLORER_PAGES) this.unlock('explorateur');
  }

  private add(id: string, broadcast: boolean): void {
    const def = ACHIEVEMENT_BY_ID.get(id);
    if (!def || this.unlockedIds().has(id)) return;
    const next = new Set(this.unlockedIds());
    next.add(id);
    this.unlockedIds.set(next);
    this.write(STORAGE_KEY, next);
    this.lastEvent.set({ def, seq: ++this.seq });
    if (broadcast) this.bus.send({ type: 'achievement', id });
  }

  private read(key: string): Set<string> {
    try {
      const raw = this.storage?.getItem(key);
      const list: unknown = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : []);
    } catch {
      return new Set();
    }
  }

  private write(key: string, ids: ReadonlySet<string>): void {
    try {
      this.storage?.setItem(key, JSON.stringify([...ids]));
    } catch {
      // Stockage indisponible : les succès durent le temps de la visite.
    }
  }
}
