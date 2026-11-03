import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  output,
  viewChild,
} from '@angular/core';

import { FrameLoop } from '@core/dom/frame-loop';
import { clamp, contentOrigin } from '@core/geometry/geometry';
import { HolePresence, WindowBus } from '@core/sync/window-bus';
import { BlackHoleRenderer, HOLE_PALETTE, HoleView, hash, strHash } from './black-hole-renderer';

/**
 * La récompense finale : chaque fenêtre du portfolio devient un trou noir, et les fenêtres
 * ouvertes en même temps s'échangent de la lumière. Chargée à la demande (@defer).
 */
@Component({
  selector: 'app-singularity-overlay',
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
    <div class="ui">
      <h2 class="title">Singularité</h2>
      <p class="hint">
        @if (peers() === 0) {
          Ouvre une deuxième fenêtre du portfolio : elle bascule aussi en singularité. Rapproche-les.
        } @else {
          {{ peers() + 1 }} fenêtres en orbite. Rapproche-les, éloigne-les.
        }
      </p>
      <button #close type="button" (click)="closed.emit()">Revenir au portfolio · Échap</button>
    </div>
  `,
  styleUrl: './singularity-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Singularité',
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class SingularityOverlay {
  readonly closed = output<void>();

  private readonly bus = inject(WindowBus);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('close');
  protected readonly peers = computed(() => this.bus.holes.roster().length);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = this.doc.defaultView;
      const canvas = this.canvas().nativeElement;
      const ctx = canvas.getContext('2d');
      if (!win || !ctx) return;
      this.closeButton().nativeElement.focus();

      const renderer = new BlackHoleRenderer(ctx, this.doc);
      const display = new Map<string, HoleView>();
      const seed = strHash(this.bus.id);
      const rot = (hash(seed + 1) - 0.5) * 0.7;
      const spin = hash(seed + 2) < 0.5 ? 1 : -1;
      const used = new Set([...this.bus.holes.snapshot().values()].map((hole) => hole.hue));
      const hue = HOLE_PALETTE.find((h) => !used.has(h)) ?? Math.floor(hash(seed + 3) * 360);

      let dpr = 1;
      const resize = () => {
        dpr = Math.min(win.devicePixelRatio || 1, 2);
        canvas.width = Math.round(win.innerWidth * dpr);
        canvas.height = Math.round(win.innerHeight * dpr);
      };
      resize();
      win.addEventListener('resize', resize);

      const stop = this.frames.add((_now, dt) => {
        const t = Date.now();
        const T = (t % 86_400_000) / 1000; // horloge commune à toutes les fenêtres
        const origin = contentOrigin(win);
        const width = win.innerWidth;
        const height = win.innerHeight;
        const self: HolePresence = {
          id: this.bus.id,
          t,
          x: origin.x + width / 2,
          y: origin.y + height / 2,
          r: clamp(Math.min(width, height) * 0.07, 24, 64),
          hue,
          rot,
          spin,
        };
        this.bus.holes.publish(self);

        // Les trous des autres fenêtres arrivent en fondu et suivent leur fenêtre en douceur.
        const seen = new Set<string>();
        const step = dt / 1000;
        for (const state of [self, ...this.bus.holes.snapshot(t).values()]) {
          seen.add(state.id);
          const shown = display.get(state.id);
          if (!shown) {
            display.set(state.id, { ...state, vis: 0, flash: 0 });
            continue;
          }
          const f = state.id === self.id ? 1 : Math.min(1, step * 14);
          shown.x += (state.x - shown.x) * f;
          shown.y += (state.y - shown.y) * f;
          shown.r += (state.r - shown.r) * f;
          shown.hue = state.hue;
          shown.rot = state.rot;
          shown.spin = state.spin;
          shown.vis = Math.min(1, shown.vis + step * 1.2);
        }
        for (const [id, shown] of display) {
          if (seen.has(id)) continue;
          shown.vis -= step * 1.5;
          if (shown.vis <= 0) {
            display.delete(id);
            renderer.forget(id);
          }
        }
        const holes = [...display.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
        renderer.render({ ox: origin.x, oy: origin.y, w: width, h: height, dpr }, holes, T);
      });

      destroyRef.onDestroy(() => {
        stop();
        win.removeEventListener('resize', resize);
        this.bus.holes.leave(this.bus.id);
      });
    });
  }
}
