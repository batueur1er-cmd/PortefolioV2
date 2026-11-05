import { DOCUMENT, DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

import { MotionPreference } from '@core/dom/motion-preference';

/** Un bouton qui se laisse attirer par le pointeur, puis revient en place. */
@Directive({ selector: '[appMagnetic]' })
export class MagneticDirective {
  /** Part du décalage pointeur appliquée à l'élément. */
  readonly strength = input(0.28, {
    alias: 'appMagnetic',
    transform: (value: number | string) => Number(value) || 0.28,
  });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const doc = inject(DOCUMENT);
    const motion = inject(MotionPreference);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const win = doc.defaultView;
      if (!win?.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

      const onMove = (e: PointerEvent) => {
        if (motion.reduced()) return;
        const rect = element.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const k = this.strength();
        element.style.transform = `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)`;
      };
      const onLeave = () => (element.style.transform = '');

      element.addEventListener('pointermove', onMove, { passive: true });
      element.addEventListener('pointerleave', onLeave);
      destroyRef.onDestroy(() => {
        element.removeEventListener('pointermove', onMove);
        element.removeEventListener('pointerleave', onLeave);
      });
    });
  }
}
