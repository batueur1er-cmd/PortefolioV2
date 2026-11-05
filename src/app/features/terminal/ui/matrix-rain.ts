import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  viewChild,
} from '@angular/core';

/** Durée de la pluie, en ms. */
const DURATION = 7000;
/** Taille d'une colonne de caractères, en px. */
const CELL = 18;
const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789BNANGULARTS<>{}=+*';

/**
 * La pluie de caractères de la commande « matrix », par-dessus tout le site pendant quelques
 * secondes. Les couleurs viennent du thème (fond plan d'architecte, caractères cyan). Un clic ou
 * Échap l'arrête plus tôt.
 */
@Component({
  selector: 'app-matrix-rain',
  template: `<canvas #canvas></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: block;
      cursor: pointer;
      animation: matrix-fade 7s linear forwards;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    @keyframes matrix-fade {
      0% {
        opacity: 0;
      }
      6%,
      88% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '(click)': 'finished.emit()' },
})
export class MatrixRain {
  /** La pluie est terminée (ou interrompue d'un clic). */
  readonly finished = output<void>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = doc.defaultView;
      const canvas = this.canvas().nativeElement;
      const ctx = canvas.getContext('2d');
      if (!win || !ctx) return;
      const styles = win.getComputedStyle(doc.documentElement);
      const background = styles.getPropertyValue('--xbg').trim() || 'black';
      const ink = styles.getPropertyValue('--xl').trim() || 'cyan';
      const head = styles.getPropertyValue('--xtext').trim() || 'white';

      const ratio = win.devicePixelRatio || 1;
      const width = win.innerWidth;
      const height = win.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.scale(ratio, ratio);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${CELL - 2}px ui-monospace, Consolas, monospace`;

      const drops = Array.from({ length: Math.ceil(width / CELL) }, () => -Math.random() * (height / CELL));
      const start = win.performance.now();
      let last = start;
      let frame = 0;

      const draw = (now: number) => {
        if (now - start >= DURATION) {
          this.finished.emit();
          return;
        }
        // Environ 20 images par seconde : la pluie garde son allure de vieux terminal.
        if (now - last >= 50) {
          last = now;
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 1;
          drops.forEach((y, i) => {
            const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            ctx.fillStyle = Math.random() < 0.1 ? head : ink;
            ctx.fillText(glyph, i * CELL, y * CELL);
            drops[i] = y * CELL > height && Math.random() > 0.975 ? 0 : y + 1;
          });
        }
        frame = win.requestAnimationFrame(draw);
      };
      frame = win.requestAnimationFrame(draw);
      destroyRef.onDestroy(() => win.cancelAnimationFrame(frame));
    });
  }
}
