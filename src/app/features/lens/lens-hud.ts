import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type LensState = 'searching' | 'off' | 'on';

/** L'habillage de la fenêtre loupe : viseur, zoom, détecteur, progression et messages. */
@Component({
  selector: 'app-lens-hud',
  templateUrl: './lens-hud.html',
  styleUrl: './lens-hud.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.locked]': 'progress() > 0' },
})
export class LensHud {
  readonly zoom = input(1);
  readonly found = input(0);
  readonly total = input(0);
  /** Proximité du secret le plus proche, de 0 à 1. */
  readonly strength = input(0);
  /** Avancement de l'analyse en cours, de 0 à 1. */
  readonly progress = input(0);
  readonly state = input<LensState>('searching');
  /** Section du portfolio sous le réticule. */
  readonly section = input<string | null>(null);
  readonly muted = input(true);
  readonly toast = input<string | null>(null);

  readonly toggleSound = output<void>();

  protected readonly bars = [0, 1, 2, 3, 4];
  protected readonly zoomLabel = computed(() => this.zoom().toFixed(1).replace('.', ','));
  protected readonly level = computed(() => Math.round(this.strength() * 5));
}
