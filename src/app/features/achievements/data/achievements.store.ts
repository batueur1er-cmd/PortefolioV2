import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { safeStorage } from '@core/dom/dom';
import { PROFILE } from '@domain/profile/profile.data';
import { SCHEMA_VISUALS } from '@shared/ui/project-schema/project-schema';
import { WindowBus } from '@core/sync/window-bus';

import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, AchievementDef, EXPLORER_PAGES } from './achievements.catalog';

const STORAGE_KEY = 'pv2.achievements';
const VISITED_KEY = 'pv2.projects-seen';
const SCHEMAS_KEY = 'pv2.schemas-seen';

const ALL_PROJECTS = PROFILE.projects.map((p) => p.id);
/** Les projets dont la page montre un schéma de principe. */
const SCHEMA_PROJECTS = PROFILE.projects.filter((p) => SCHEMA_VISUALS.includes(p.visual)).map((p) => p.id);

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
      else if (command.type === 'achievements-reset') this.clear();
    });
  }

  /** Oublie tous les succès et les visites qui y mènent, dans toutes les fenêtres. */
  reset(): void {
    this.clear();
    this.bus.send({ type: 'achievements-reset' });
  }

  private clear(): void {
    this.unlockedIds.set(new Set());
    this.lastEvent.set(null);
    for (const key of [STORAGE_KEY, VISITED_KEY, SCHEMAS_KEY]) this.write(key, new Set());
  }

  unlock(id: string): void {
    this.add(id, true);
  }

  /** Note la visite d'une page projet ; la troisième différente débloque « Explorateur ». */
  visitProject(id: string): void {
    const seen = this.remember(VISITED_KEY, id);
    if (seen.size >= EXPLORER_PAGES) this.unlock('explorateur');
    if (ALL_PROJECTS.every((p) => seen.has(p))) this.unlock('tour-complet');
  }

  /** Note un schéma de principe vu sur une page projet ; tous vus débloquent « Lecteur de plans ». */
  seeSchema(id: string): void {
    const seen = this.remember(SCHEMAS_KEY, id);
    if (SCHEMA_PROJECTS.every((p) => seen.has(p))) this.unlock('lecteur-de-plans');
  }

  /** Ajoute un identifiant à une liste gardée dans le navigateur, et la renvoie. */
  private remember(key: string, id: string): Set<string> {
    const seen = this.read(key);
    if (!seen.has(id)) {
      seen.add(id);
      this.write(key, seen);
    }
    return seen;
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
