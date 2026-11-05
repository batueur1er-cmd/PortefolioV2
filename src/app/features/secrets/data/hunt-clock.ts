import { DOCUMENT, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import { safeStorage } from '@core/dom/dom';
import { Clock } from '@core/time/clock';

import { SECRETS, SECTION_LABELS } from './secrets.catalog';
import { SecretsStore } from './secrets.store';

const BEST_KEY = 'pv2.best-hunt';
/** Départ et fin de la chasse en cours : elle survit à un rechargement, comme les secrets. */
const RUN_KEY = 'pv2.hunt-run';

interface HuntRun {
  readonly start: number | null;
  readonly finished: number | null;
}

/** « 02:14 », ou « 1:02:14 » au-delà d'une heure. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Masque une lettre sur deux de chaque mot : « Le gr_p_e d_s c_m_é_e_c_s ». */
export function maskLabel(label: string): string {
  return label
    .split(' ')
    .map((word) => (word.length <= 2 ? word : [...word].map((c, i) => (i % 2 && /\p{L}/u.test(c) ? '_' : c)).join('')))
    .join(' ');
}

/**
 * Le chronomètre de la chasse : il part au premier secret trouvé et s'arrête au dernier. Le
 * meilleur temps et la chasse en cours restent dans le navigateur ; « oublier secrets » la relance.
 */
@Injectable({ providedIn: 'root' })
export class HuntClock {
  private readonly store = inject(SecretsStore);
  private readonly clock = inject(Clock);
  private readonly storage = safeStorage(inject(DOCUMENT).defaultView);

  private readonly run = this.readRun();
  private readonly startedAt = signal<number | null>(this.run.start);
  private readonly finished = signal<number | null>(this.run.finished);
  private readonly bestMs = signal<number | null>(this.readBest());

  /** Temps écoulé depuis le premier secret (figé à la fin de la chasse). */
  readonly elapsed = computed(() => {
    const start = this.startedAt();
    if (start === null) return 0;
    return this.finished() ?? this.clock.now() - start;
  });
  readonly running = computed(() => this.startedAt() !== null && this.finished() === null);
  readonly finalTime = this.finished.asReadonly();
  readonly best = this.bestMs.asReadonly();

  constructor() {
    effect(() => {
      const count = this.store.count();
      const complete = this.store.complete();
      untracked(() => {
        if (count === 0) {
          this.startedAt.set(null);
          this.finished.set(null);
          this.saveRun();
          return;
        }
        const now = this.clock.now();
        if (this.startedAt() === null) {
          this.startedAt.set(now);
          this.saveRun();
        }
        if (complete && this.finished() === null) {
          const time = now - (this.startedAt() ?? now);
          this.finished.set(time);
          this.saveRun();
          const best = this.bestMs();
          if (best === null || time < best) this.saveBest(time);
        }
      });
    });
  }

  /** Un indice flou sur un secret pas encore trouvé : sa section et son nom à moitié masqué. */
  hint(): string | null {
    const found = this.store.found();
    const left = SECRETS.filter((s) => !found.has(s.id));
    if (!left.length) return null;
    const secret = left[Math.floor(this.clock.now() / 1000) % left.length];
    return `Section « ${SECTION_LABELS[secret.section]} » : ${maskLabel(secret.label)}`;
  }

  private readBest(): number | null {
    try {
      const value = Number(this.storage?.getItem(BEST_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  private saveBest(ms: number): void {
    this.bestMs.set(ms);
    try {
      this.storage?.setItem(BEST_KEY, String(Math.round(ms)));
    } catch {
      // Stockage indisponible : le record dure le temps de la visite.
    }
  }

  private readRun(): HuntRun {
    try {
      const raw = JSON.parse(this.storage?.getItem(RUN_KEY) ?? 'null') as Partial<HuntRun> | null;
      const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
      return { start: num(raw?.start), finished: num(raw?.finished) };
    } catch {
      return { start: null, finished: null };
    }
  }

  private saveRun(): void {
    try {
      this.storage?.setItem(RUN_KEY, JSON.stringify({ start: this.startedAt(), finished: this.finished() }));
    } catch {
      // Stockage indisponible : le chrono dure le temps de la visite.
    }
  }
}
