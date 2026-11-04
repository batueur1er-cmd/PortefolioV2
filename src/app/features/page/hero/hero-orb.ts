import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';

import { PageContext } from '../page-context';

/**
 * Une sphère posée sur la page, comme une lentille. Elle suit doucement le pointeur et sa
 * lumière tourne avec lui. En rayons X, on voit sa construction.
 */
@Component({
  selector: 'app-hero-orb',
  template: `
    <div class="sphere surface-only" aria-hidden="true">
      <img class="photo" src="me/baptiste.png" alt="" width="1024" height="1024" fetchpriority="high" />
      <span class="ring r1"></span>
      <span class="ring r2"></span>
      <span class="shine"></span>
    </div>
    <!-- Rayons X : la photo du chat. Dépose-la dans public/me/chat.jpg. -->
    <div class="xv cat" aria-hidden="true">
      @if (!catMissing()) {
        <img src="me/chat.jpg" alt="" (error)="catMissing.set(true)" />
      } @else {
        <span>photo du chat<br />public/me/chat.jpg</span>
      }
    </div>
    <svg class="xv wire plan" viewBox="0 0 320 320" aria-hidden="true">
      <circle cx="160" cy="160" r="150" />
      <g class="spin">
        <circle class="d" cx="160" cy="160" r="122" />
        <circle class="d" cx="160" cy="160" r="88" />
        <path class="hot" d="M160 10 A150 150 0 0 1 310 160" />
      </g>
      <line class="d" x1="0" y1="160" x2="320" y2="160" />
      <line class="d" x1="160" y1="0" x2="160" y2="320" />
      <path class="hot" d="M160 160 L266 54" />
      <text x="214" y="96">r = 150</text>
      <text x="14" y="150">3 dégradés radiaux</text>
      <text x="14" y="182">suit le pointeur · 0,06</text>
    </svg>
  `,
  styleUrl: './hero-orb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroOrb {
  protected readonly catMissing = signal(false);

  constructor() {
    const page = inject(PageContext);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const win = doc.defaultView;
      if (page.decorative() || !win?.matchMedia('(pointer: fine)').matches) return;
      const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
      let frame = 0;
      const onMove = (e: PointerEvent) => {
        if (reduced.matches) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = host.getBoundingClientRect();
          // Hors de l'écran, la sphère ne bouge pas : sinon l'écart devient énorme et elle s'envole.
          if (rect.bottom < 0 || rect.top > win.innerHeight) return;
          const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));
          const dx = (e.clientX - (rect.left + rect.width / 2)) / win.innerWidth;
          const dy = (e.clientY - (rect.top + rect.height / 2)) / win.innerHeight;
          host.style.setProperty('--px', clamp(dx).toFixed(3));
          host.style.setProperty('--py', clamp(dy).toFixed(3));
        });
      };
      doc.addEventListener('pointermove', onMove, { passive: true });
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        doc.removeEventListener('pointermove', onMove);
      });
    });
  }
}
