import { DOCUMENT, DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

import { MotionPreference } from '@core/dom/motion-preference';

/**
 * Incline légèrement une carte vers le pointeur et y pose un halo (`--mx`, `--my` en %).
 * Rien sur écran tactile, ni quand l'utilisateur limite les animations. Les copies de la page
 * affichées dans une loupe n'ont pas de pointeur : elles restent droites.
 */
@Directive({ selector: '[appTilt]' })
export class TiltDirective {
  /** Inclinaison maximale, en degrés. */
  readonly max = input(5, { alias: 'appTilt', transform: (value: number | string) => Number(value) || 5 });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const doc = inject(DOCUMENT);
    const motion = inject(MotionPreference);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const win = doc.defaultView;
      if (!win?.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      let frame = 0;

      const onMove = (e: PointerEvent) => {
        if (motion.reduced()) return reset();
        const rect = element.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const max = this.max();
          element.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
          element.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
          element.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max).toFixed(2)}deg) rotateY(${((px - 0.5) * max).toFixed(2)}deg)`;
          element.classList.add('tilting');
        });
      };
      const reset = () => {
        cancelAnimationFrame(frame);
        element.style.transform = '';
        element.classList.remove('tilting');
      };

      element.addEventListener('pointermove', onMove, { passive: true });
      element.addEventListener('pointerleave', reset);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        element.removeEventListener('pointermove', onMove);
        element.removeEventListener('pointerleave', reset);
      });
    });
  }
}
