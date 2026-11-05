import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';

import { FrameLoop } from '@core/dom/frame-loop';
import { MotionPreference } from '@core/dom/motion-preference';

const INTERACTIVE = 'a, button, [tabindex]:not([tabindex="-1"]), summary, label';

/**
 * Un anneau qui suit le pointeur avec un peu d'inertie et s'ouvre sur ce qui est cliquable.
 * Souris seulement ; rien quand l'utilisateur limite les animations.
 */
@Component({
  selector: 'app-cursor-aura',
  template: '<span class="ring"></span><span class="dot"></span>',
  styleUrl: './cursor-aura.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.off]': 'off() || motion.simple()' },
})
export class CursorAura {
  protected readonly motion = inject(MotionPreference);
  /** Masqué, par exemple pendant que la loupe de poche suit déjà le pointeur. */
  readonly off = input(false);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const doc = inject(DOCUMENT);
    const frames = inject(FrameLoop);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const win = doc.defaultView;
      if (!win?.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      host.classList.add('live');
      const ring = host.firstElementChild as HTMLElement;
      const dot = host.lastElementChild as HTMLElement;
      let target = { x: -100, y: -100 };
      let pos = { ...target };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        target = { x: e.clientX, y: e.clientY };
        dot.style.transform = `translate(${target.x}px, ${target.y}px)`;
        const over = e.target instanceof Element && e.target.closest(INTERACTIVE);
        host.classList.toggle('hover', !!over);
      };
      const onLeave = () => host.classList.add('away');
      const onEnter = () => host.classList.remove('away');
      const onDown = () => host.classList.add('press');
      const onUp = () => host.classList.remove('press');

      doc.addEventListener('pointermove', onMove, { passive: true });
      doc.documentElement.addEventListener('pointerleave', onLeave);
      doc.documentElement.addEventListener('pointerenter', onEnter);
      doc.addEventListener('pointerdown', onDown);
      doc.addEventListener('pointerup', onUp);
      const stop = frames.add(() => {
        pos = { x: pos.x + (target.x - pos.x) * 0.2, y: pos.y + (target.y - pos.y) * 0.2 };
        ring.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`;
      });

      destroyRef.onDestroy(() => {
        stop();
        doc.removeEventListener('pointermove', onMove);
        doc.documentElement.removeEventListener('pointerleave', onLeave);
        doc.documentElement.removeEventListener('pointerenter', onEnter);
        doc.removeEventListener('pointerdown', onDown);
        doc.removeEventListener('pointerup', onUp);
      });
    });
  }
}
