import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
} from '@angular/core';

import { FrameLoop } from '@core/dom/frame-loop';
import { contentOrigin } from '@core/geometry/geometry';
import { WindowBus, isLens } from '@core/sync/window-bus';

/** Halo lumineux autour de chaque fenêtre loupe posée sur ce portfolio. */
@Component({
  selector: 'app-lens-frames',
  template: `
    @for (lens of lenses(); track lens.id) {
      <div class="frame" [attr.data-lens]="lens.id"><span class="tag">loupe</span></div>
    }
  `,
  styleUrl: './lens-frames.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class LensFrames {
  private readonly bus = inject(WindowBus);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly lenses = computed(() => this.bus.windows.roster().filter(isLens));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = this.doc.defaultView;
      if (!win) return;
      const stop = this.frames.add(() => {
        const origin = contentOrigin(win);
        const peers = this.bus.windows.snapshot();
        for (const frame of Array.from(this.host.querySelectorAll<HTMLElement>('.frame'))) {
          const lens = peers.get(frame.dataset['lens'] ?? '');
          if (!lens || !isLens(lens)) continue;
          frame.style.transform = `translate(${lens.origin.x - origin.x}px, ${lens.origin.y - origin.y}px)`;
          frame.style.width = `${lens.viewport.w}px`;
          frame.style.height = `${lens.viewport.h}px`;
          frame.classList.toggle('on', lens.target === this.bus.id);
          const tag = frame.firstElementChild as HTMLElement | null;
          const label = lens.section ? `loupe · ${lens.section}` : 'loupe';
          if (tag && tag.textContent !== label) tag.textContent = label;
        }
      });
      destroyRef.onDestroy(stop);
    });
  }
}
