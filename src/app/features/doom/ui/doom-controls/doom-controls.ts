import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { FrameCounts, PHASES, PadAction, ReplayPhase, ReplayState, SCREEN_PIXELS } from '../../data/doom-state';

interface PadKey {
  readonly action: PadAction;
  readonly label: string;
  readonly glyph: string;
}

const PAD: readonly PadKey[] = [
  { action: 'gauche', label: 'Tourner à gauche', glyph: '↺' },
  { action: 'avancer', label: 'Avancer', glyph: '↑' },
  { action: 'droite', label: 'Tourner à droite', glyph: '↻' },
  { action: 'pas-gauche', label: 'Pas de côté vers la gauche', glyph: '←' },
  { action: 'reculer', label: 'Reculer', glyph: '↓' },
  { action: 'pas-droite', label: 'Pas de côté vers la droite', glyph: '→' },
];

const LIVE = {
  plain: 'Une image se dessine en trois temps : les murs, puis les sols, puis les objets.',
  tech: 'R_RenderPlayerView : R_RenderBSPNode → R_DrawPlanes → R_DrawMasked',
};

/**
 * Les commandes de la démo : le pavé de déplacement (pour la souris et le doigt), le rendu au
 * ralenti, et les compteurs de l'image. En clair à la surface, avec les noms du code de Doom aux rayons X.
 */
@Component({
  selector: 'app-doom-controls',
  templateUrl: './doom-controls.html',
  styleUrl: './doom-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoomControls {
  readonly replay = input.required<ReplayState>();
  /** Avancement du rendu au ralenti, de 0 à 1. */
  readonly progress = input(0);
  readonly phase = input<ReplayPhase | null>(null);
  readonly bsp = input(false);
  readonly painter = input(false);
  readonly limits = input(true);
  /** Champ de vision, en degrés. */
  readonly fov = input(90);
  readonly minFov = input(60);
  readonly maxFov = input(120);
  readonly counts = input.required<FrameCounts>();
  readonly chestsFound = input(0);
  readonly chestsTotal = input(0);

  readonly hold = output<{ action: PadAction; down: boolean }>();
  /** Une touche du pavé activée au clavier : un petit pas. */
  readonly nudge = output<PadAction>();
  readonly useDoor = output<void>();
  readonly replayToggle = output<void>();
  readonly replayStop = output<void>();
  readonly scrub = output<number>();
  readonly bspToggle = output<void>();
  readonly painterToggle = output<void>();
  readonly limitsToggle = output<void>();
  readonly fovChange = output<number>();

  protected readonly pad = PAD;

  protected readonly playLabel = computed(() => {
    const state = this.replay();
    if (state === 'playing') return 'Pause';
    if (state === 'paused') return this.progress() >= 1 ? 'Rejouer l’image' : 'Reprendre';
    return 'Dessiner l’image au ralenti';
  });

  protected readonly phaseText = computed(() => {
    const phase = this.phase();
    return phase ? PHASES[phase] : LIVE;
  });

  protected readonly valueText = computed(() => `${Math.round(this.progress() * 100)} % : ${this.phaseText().plain}`);

  /** La distance focale qui donne ce champ de vision sur 320 colonnes : 160 pixels à 90°. */
  protected readonly focal = computed(() => Math.round(160 / Math.tan((this.fov() * Math.PI) / 360)));

  protected readonly fovNote = computed(() => {
    const fov = this.fov();
    if (fov === 90) return 'Comme dans Doom.';
    return fov < 90 ? 'Plus serré : on voit moins, mais plus gros.' : 'Plus large : on voit plus, les bords s’étirent.';
  });

  protected readonly rows = computed(() => {
    const c = this.counts();
    return [
      { key: 'subsectors', plain: 'Zones parcourues', tech: 'subsectors', value: c.subsectors },
      { key: 'culled', plain: 'Zones écartées d’avance', tech: 'R_CheckBBox : caché', value: c.culled },
      { key: 'walls', plain: 'Morceaux de mur', tech: 'drawsegs / 256', value: c.walls },
      { key: 'visplanes', plain: 'Sols et plafonds', tech: 'visplanes / 128', value: c.visplanes },
      { key: 'sprites', plain: 'Objets peints', tech: 'vissprites / 128', value: c.sprites },
      { key: 'ops', plain: 'Bandes et lignes', tech: 'colonnes + spans', value: c.ops },
      { key: 'pixels', plain: 'Pixels peints', tech: `écrits / ${SCREEN_PIXELS}`, value: c.pixels },
      { key: 'chests', plain: 'Coffres trouvés', tech: 'THINGS hors secteur', value: `${this.chestsFound()} / ${this.chestsTotal()}` },
      { key: 'waste', plain: 'Peints pour rien', tech: 'overdraw', value: Math.max(0, c.pixels - SCREEN_PIXELS) },
    ];
  });

  protected readonly methodText = computed(() =>
    this.painter()
      ? {
          plain: 'Algorithme du peintre : tout est peint du fond vers l’avant, et chaque surface recouvre la précédente.',
          tech: 'Toujours l’arbre pour l’ordre, mais à l’envers. Ni solidsegs, ni visplanes, ni découpe des sprites. La couleur donne le nombre d’écritures.',
        }
      : {
          plain: 'Méthode de Doom : du plus proche au plus lointain, chaque pixel de décor n’est écrit qu’une fois.',
          tech: 'Solidsegs + clips par colonne : seuls les sprites repassent sur le décor.',
        },
  );

  protected press(action: PadAction, event: PointerEvent): void {
    if (event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.hold.emit({ action, down: true });
  }

  protected release(action: PadAction): void {
    this.hold.emit({ action, down: false });
  }

  /** Un clic venu du clavier (Entrée, Espace) n'a pas de pointeur : il fait faire un petit pas. */
  protected click(action: PadAction, event: MouseEvent): void {
    if (event.detail === 0) this.nudge.emit(action);
  }

  protected onFov(event: Event): void {
    this.fovChange.emit(Number((event.target as HTMLInputElement).value));
  }

  protected onScrub(event: Event): void {
    this.scrub.emit(Number((event.target as HTMLInputElement).value) / 1000);
  }
}
