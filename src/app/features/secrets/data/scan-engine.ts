/** Part minimale d'un secret qui doit être sous la loupe pour que l'analyse démarre. */
export const SCAN_COVERAGE = 0.6;

/** Temps d'analyse avant qu'un secret soit considéré comme trouvé. */
export const SCAN_DWELL_MS = 550;

export interface ScanResult {
  /** Secrets dont l'analyse vient d'aboutir. */
  readonly completed: readonly string[];
  /** Secret le plus avancé, pour l'anneau de progression. */
  readonly focus: string | null;
  /** Avancement du secret le plus avancé, de 0 à 1. */
  readonly progress: number;
}

/**
 * Un secret n'est trouvé qu'après être resté sous la loupe pendant un court instant :
 * balayer la page à toute vitesse ne suffit pas. L'avancement retombe deux fois plus vite
 * qu'il ne monte quand la loupe s'éloigne.
 */
export class ScanEngine {
  private readonly dwell = new Map<string, number>();

  constructor(private readonly dwellMs = SCAN_DWELL_MS) {}

  step(candidates: ReadonlySet<string>, dt: number): ScanResult {
    for (const [id, value] of this.dwell) {
      if (candidates.has(id)) continue;
      const next = value - dt * 2;
      if (next > 0) this.dwell.set(id, next);
      else this.dwell.delete(id);
    }

    const completed: string[] = [];
    let focus: string | null = null;
    let best = 0;
    for (const id of candidates) {
      const value = (this.dwell.get(id) ?? 0) + dt;
      if (value >= this.dwellMs) {
        completed.push(id);
        this.dwell.delete(id);
      } else {
        this.dwell.set(id, value);
        if (value > best) {
          best = value;
          focus = id;
        }
      }
    }
    return { completed, focus, progress: best / this.dwellMs };
  }

  reset(): void {
    this.dwell.clear();
  }
}
