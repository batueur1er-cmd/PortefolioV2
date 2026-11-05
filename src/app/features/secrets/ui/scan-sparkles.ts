import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';

import { FrameLoop } from '@core/dom/frame-loop';
import { MotionPreference } from '@core/dom/motion-preference';
import { contentOrigin, pageZoom } from '@core/geometry/geometry';
import { LensPresence, WindowBus, isLens } from '@core/sync/window-bus';

import { SecretsStore } from '../data/secrets.store';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
}

interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * - `frame` (portfolio) : les paillettes jaillissent des bords de la fenêtre loupe posée dessus.
 * - `reticle` (loupe) : elles tournent autour du viseur.
 */
export type SparkleMode = 'frame' | 'reticle';

const MAX_SPARKS = 520;

/**
 * Des paillettes autour du scanner pendant les 4 secondes d'une analyse, qui s'intensifient avec
 * elle, puis un éclat quand le secret est trouvé. Un simple canevas fixe, sans effet sur la page.
 */
@Component({
  selector: 'app-scan-sparkles',
  template: '<canvas aria-hidden="true"></canvas>',
  styles: `
    :host,
    canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 40;
    }
    :host(.reticle),
    :host(.reticle) canvas {
      z-index: 55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.reticle]': "mode() === 'reticle'" },
})
export class ScanSparkles {
  readonly mode = input<SparkleMode>('frame');
  /** Avancement de l'analyse (mode `reticle`), de 0 à 1. */
  readonly progress = input(0);

  private readonly bus = inject(WindowBus);
  private readonly store = inject(SecretsStore);
  private readonly doc = inject(DOCUMENT);
  private readonly motion = inject(MotionPreference);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly sparks: Spark[] = [];
  /** Dernière zone d'émission, pour l'éclat final. */
  private last: Box | null = null;
  private lastAt = 0;
  private colors = ['#ffd84d'];
  private budget = 0;
  private dirty = false;

  constructor() {
    const frames = inject(FrameLoop);
    const destroyRef = inject(DestroyRef);

    // Secret trouvé : un éclat de paillettes depuis le scanner.
    effect(() => {
      const event = this.store.lastFound();
      // Seulement si l'analyse vient de se terminer ici : pas d'éclat sur une vieille position.
      if (event && this.last && performance.now() - this.lastAt < 800 && !this.motion.reduced()) this.burst(this.last);
    });

    afterNextRender(() => {
      const win = this.doc.defaultView;
      const canvas = this.host.querySelector('canvas');
      const ctx = canvas?.getContext('2d');
      if (!win || !canvas || !ctx) return;
      this.readColors(win);
      let since = 0;
      const stop = frames.add((_now, dt) => {
        if ((since += dt) > 1000) {
          since = 0;
          this.readColors(win);
        }
        if (this.motion.reduced()) this.sparks.length = 0;
        else this.emit(win, dt);
        this.draw(ctx, canvas, win, dt);
      });
      destroyRef.onDestroy(stop);
    });
  }

  private readColors(win: Window): void {
    const style = win.getComputedStyle(this.doc.documentElement);
    const names = this.mode() === 'reticle' ? ['--xn', '--xl', '--xp'] : ['--accent', '--accent-2', '--art-gold', '--xn'];
    const list = names.map((name) => style.getPropertyValue(name).trim()).filter(Boolean);
    if (list.length) this.colors = list;
  }

  private emit(win: Window, dt: number): void {
    const scan = this.mode() === 'reticle' ? this.reticleScan(win) : this.frameScan(win);
    if (!scan) return;
    this.last = scan.box;
    this.lastAt = performance.now();
    this.budget += (dt / 1000) * (40 + scan.progress * 220);
    while (this.budget >= 1) {
      this.budget--;
      this.spawn(scan.box, scan.progress, false);
    }
  }

  /** Portfolio : la fenêtre loupe qui analyse un secret de cette page, en pixels CSS d'ici. */
  private frameScan(win: Window): { box: Box; progress: number } | null {
    let lens: LensPresence | null = null;
    for (const state of this.bus.windows.snapshot().values()) {
      if (isLens(state) && state.target === this.bus.id && state.scan) lens = state;
    }
    if (!lens?.scan) return null;
    const zoom = pageZoom(win);
    const origin = contentOrigin(win, zoom);
    const k = lens.pageZoom / zoom;
    return {
      box: {
        x: (lens.origin.x - origin.x) / zoom,
        y: (lens.origin.y - origin.y) / zoom,
        w: lens.viewport.w * k,
        h: lens.viewport.h * k,
      },
      progress: lens.scan.progress,
    };
  }

  /** Loupe : un cercle autour du viseur, qui grandit avec l'analyse. */
  private reticleScan(win: Window): { box: Box; progress: number } | null {
    const progress = this.progress();
    if (progress <= 0) return null;
    const r = 44 + progress * 34;
    return { box: { x: win.innerWidth / 2 - r, y: win.innerHeight / 2 - r, w: r * 2, h: r * 2 }, progress };
  }

  private burst(box: Box): void {
    for (let i = 0; i < 160; i++) this.spawn(box, 1, true);
  }

  /** Une paillette sur le pourtour de la zone (cadre ou cercle), lancée vers l'extérieur. */
  private spawn(box: Box, power: number, burst: boolean): void {
    if (this.sparks.length >= MAX_SPARKS) this.sparks.shift();
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    let x: number;
    let y: number;
    let nx: number;
    let ny: number;
    if (this.mode() === 'reticle') {
      const a = Math.random() * Math.PI * 2;
      nx = Math.cos(a);
      ny = Math.sin(a);
      x = cx + nx * (box.w / 2);
      y = cy + ny * (box.h / 2);
    } else {
      // Un point au hasard sur le périmètre du cadre, et la normale du côté choisi.
      const t = Math.random() * 2 * (box.w + box.h);
      if (t < box.w) [x, y, nx, ny] = [box.x + t, box.y, 0, -1];
      else if (t < box.w + box.h) [x, y, nx, ny] = [box.x + box.w, box.y + t - box.w, 1, 0];
      else if (t < 2 * box.w + box.h) [x, y, nx, ny] = [box.x + box.w - (t - box.w - box.h), box.y + box.h, 0, 1];
      else [x, y, nx, ny] = [box.x, box.y + box.h - (t - 2 * box.w - box.h), -1, 0];
    }
    const speed = burst ? 120 + Math.random() * 320 : 25 + Math.random() * (40 + power * 90);
    const jitter = (Math.random() - 0.5) * (burst ? 1.4 : 0.9);
    const vx = nx * Math.cos(jitter) - ny * Math.sin(jitter);
    const vy = nx * Math.sin(jitter) + ny * Math.cos(jitter);
    const max = burst ? 900 + Math.random() * 900 : 600 + Math.random() * 800;
    this.sparks.push({
      x,
      y,
      vx: vx * speed,
      vy: vy * speed - (burst ? 30 : 10),
      life: max,
      max,
      size: (burst ? 3 : 1.8) + Math.random() * (2 + power * 3.5),
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      spin: Math.random() * Math.PI,
    });
  }

  private draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, win: Window, dt: number): void {
    const ratio = win.devicePixelRatio || 1;
    const w = Math.round(win.innerWidth * ratio);
    const h = Math.round(win.innerHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    if (!this.sparks.length) {
      if (this.dirty) ctx.clearRect(0, 0, w, h);
      this.dirty = false;
      return;
    }
    this.dirty = true;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, win.innerWidth, win.innerHeight);
    const s = dt / 1000;
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      p.vx *= 1 - 1.6 * s;
      p.vy = p.vy * (1 - 1.6 * s) + 24 * s;
      p.x += p.vx * s;
      p.y += p.vy * s;
      p.spin += s * 3;
      const t = p.life / p.max;
      // Scintillement : chaque paillette clignote à son rythme en s'éteignant.
      ctx.globalAlpha = t * (0.55 + 0.45 * Math.sin(p.spin * 4));
      ctx.fillStyle = p.color;
      star(ctx, p.x, p.y, p.size * (0.6 + t * 0.4), p.spin);
    }
    ctx.globalAlpha = 1;
  }
}

/** Une étoile à quatre branches, la forme classique d'une paillette. */
function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    const d = i % 2 ? r * 0.28 : r;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}
