import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';

import { FrameLoop } from '@core/dom/frame-loop';
import { MotionPreference } from '@core/dom/motion-preference';
import { TODAY } from '@core/time/time';

import { Season, isSeason, seasonOf } from './season';

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
}

/**
 * Décor de saison, sur la fenêtre portfolio seulement (pas dans la page, donc pas dans la loupe).
 * Calculé d'après la date du jour ; `?saison=hiver` ou `?saison=halloween` le force.
 */
@Component({
  selector: 'app-season-decor',
  template: '<canvas aria-hidden="true"></canvas>',
  styles: `
    :host,
    canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 36;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonDecor {
  constructor() {
    const doc = inject(DOCUMENT);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const frames = inject(FrameLoop);
    const motion = inject(MotionPreference);
    const destroyRef = inject(DestroyRef);
    const forced = new URLSearchParams(doc.location.search).get('saison');
    const season: Season = isSeason(forced) ? forced : seasonOf(inject(TODAY));

    afterNextRender(() => {
      const win = doc.defaultView;
      const canvas = host.querySelector('canvas');
      const ctx = canvas?.getContext('2d');
      if (!season || !win || !canvas || !ctx) return;
      const style = win.getComputedStyle(doc.documentElement);
      const ink = style.getPropertyValue('--ink').trim() || '#111827';
      const accent = style.getPropertyValue('--art-gold').trim() || '#f0b35a';
      const muted = style.getPropertyValue('--muted').trim() || '#4b5563';

      const count = season === 'hiver' ? 90 : 16;
      const items: Flake[] = Array.from({ length: count }, () => ({
        x: Math.random() * win.innerWidth,
        y: Math.random() * win.innerHeight,
        r: season === 'hiver' ? 1 + Math.random() * 2.6 : 7 + Math.random() * 7,
        vy: season === 'hiver' ? 18 + Math.random() * 30 : 10 + Math.random() * 16,
        sway: 10 + Math.random() * 30,
        phase: Math.random() * Math.PI * 2,
      }));

      const stop = frames.add((now, dt) => {
        const ratio = win.devicePixelRatio || 1;
        const w = win.innerWidth;
        const h = win.innerHeight;
        if (canvas.width !== Math.round(w * ratio)) {
          canvas.width = Math.round(w * ratio);
          canvas.height = Math.round(h * ratio);
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (motion.reduced()) return;
        const s = dt / 1000;
        for (const it of items) {
          it.y += (season === 'hiver' ? it.vy : -it.vy) * s;
          if (season === 'hiver' && it.y > h + 10) [it.y, it.x] = [-10, Math.random() * w];
          if (season === 'halloween' && it.y < -20) [it.y, it.x] = [h + 20, Math.random() * w];
          const x = it.x + Math.sin(now / 1000 + it.phase) * it.sway;
          if (season === 'hiver') {
            ctx.globalAlpha = 0.35 + it.r / 8;
            ctx.fillStyle = muted;
            ctx.beginPath();
            ctx.arc(x, it.y, it.r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.globalAlpha = 0.55;
            bat(ctx, x, it.y, it.r, Math.sin(now / 120 + it.phase), ink);
          }
        }
        if (season === 'halloween') {
          ctx.globalAlpha = 0.9;
          for (let i = 0; i < 3; i++) pumpkin(ctx, w - 70 - i * 44, h - 26, 16 - i * 3, accent, ink);
        }
        ctx.globalAlpha = 1;
      });
      destroyRef.onDestroy(stop);
    });
  }
}

/** Une chauve-souris en deux arcs, ailes battantes. */
function bat(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, flap: number, color: string): void {
  const lift = r * 0.5 * flap;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - r * 0.6, y - r * 0.6 - lift, x - r * 1.4, y - lift);
  ctx.quadraticCurveTo(x - r * 0.7, y + r * 0.1, x, y + r * 0.35);
  ctx.quadraticCurveTo(x + r * 0.7, y + r * 0.1, x + r * 1.4, y - lift);
  ctx.quadraticCurveTo(x + r * 0.6, y - r * 0.6 - lift, x, y);
  ctx.fill();
}

/** Une citrouille posée en bas de l'écran. */
function pumpkin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, ink: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.2, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.fillRect(x - 1.5, y - r - 5, 3, 6);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y - r * 0.2);
  ctx.lineTo(x - r * 0.25, y - r * 0.45);
  ctx.lineTo(x - r * 0.05, y - r * 0.2);
  ctx.moveTo(x + r * 0.05, y - r * 0.2);
  ctx.lineTo(x + r * 0.25, y - r * 0.45);
  ctx.lineTo(x + r * 0.5, y - r * 0.2);
  ctx.fill();
}
