import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, effect, inject } from '@angular/core';

import { FrameLoop } from '@core/dom/frame-loop';
import { MotionPreference } from '@core/dom/motion-preference';
import { WindowBus, isLens } from '@core/sync/window-bus';

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

const MAX_SPARKS = 420;

/**
 * Des paillettes sur le portfolio, à l'endroit qu'une loupe est en train d'analyser : elles
 * s'intensifient pendant les 4 secondes de l'analyse, puis éclatent quand le secret est trouvé.
 * Un simple canevas fixe par-dessus la page, sans effet sur la mise en page.
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanSparkles {
  private readonly bus = inject(WindowBus);
  private readonly store = inject(SecretsStore);
  private readonly doc = inject(DOCUMENT);
  private readonly motion = inject(MotionPreference);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly sparks: Spark[] = [];
  /** Dernière position connue de chaque secret analysé, pour l'éclat final. */
  private readonly boxes = new Map<string, Box>();
  private colors = ['#ffd84d'];
  private budget = 0;
  private dirty = false;

  constructor() {
    const frames = inject(FrameLoop);
    const destroyRef = inject(DestroyRef);

    // Secret trouvé par la loupe : un éclat de paillettes à sa place.
    effect(() => {
      const event = this.store.lastFound();
      const box = event && this.boxes.get(event.def.id);
      if (box && !this.motion.reduced()) this.burst(box);
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
        else this.emit(dt);
        this.draw(ctx, canvas, win, dt);
      });
      destroyRef.onDestroy(stop);
    });
  }

  private readColors(win: Window): void {
    const style = win.getComputedStyle(this.doc.documentElement);
    const list = ['--accent', '--accent-2', '--art-gold', '--xn']
      .map((name) => style.getPropertyValue(name).trim())
      .filter(Boolean);
    if (list.length) this.colors = list;
  }

  /** Paillettes autour du secret qu'une loupe posée sur cette fenêtre analyse. */
  private emit(dt: number): void {
    let scan: { readonly id: string; readonly progress: number } | null = null;
    for (const state of this.bus.windows.snapshot().values()) {
      if (isLens(state) && state.target === this.bus.id && state.scan) scan = state.scan;
    }
    if (!scan) return;
    const element = this.doc.querySelector(`app-portfolio-page [data-secret="${scan.id}"]`);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const box = { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
    this.boxes.set(scan.id, box);
    this.budget += (dt / 1000) * (25 + scan.progress * 160);
    while (this.budget >= 1) {
      this.budget--;
      this.spawn(box, scan.progress, false);
    }
  }

  private burst(box: Box): void {
    for (let i = 0; i < 120; i++) this.spawn(box, 1, true);
  }

  private spawn(box: Box, power: number, burst: boolean): void {
    if (this.sparks.length >= MAX_SPARKS) this.sparks.shift();
    const pad = 18 + power * 22;
    const angle = Math.random() * Math.PI * 2;
    const speed = burst ? 80 + Math.random() * 260 : 10 + Math.random() * 40;
    const max = burst ? 900 + Math.random() * 900 : 700 + Math.random() * 900;
    this.sparks.push({
      x: burst ? box.x + box.w / 2 : box.x - pad + Math.random() * (box.w + pad * 2),
      y: burst ? box.y + box.h / 2 : box.y - pad + Math.random() * (box.h + pad * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (burst ? 40 : 18),
      life: max,
      max,
      size: (burst ? 3 : 1.6) + Math.random() * (2 + power * 3),
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
      p.vx *= 1 - 1.8 * s;
      p.vy = p.vy * (1 - 1.8 * s) + 30 * s;
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
