import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FrameLoop } from '@core/dom/frame-loop';
import { contentOrigin, pageZoom } from '@core/geometry/geometry';
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
  host: { 'aria-hidden': 'true', '[class.behind]': 'focused()' },
})
export class LensFrames {
  private readonly bus = inject(WindowBus);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly lenses = computed(() => this.bus.windows.roster().filter(isLens));
  /**
   * Le portfolio a le focus : on vient de cliquer dessus, sa fenêtre est passée devant la loupe.
   * Le cadre ne montrerait plus qu'une loupe cachée : il s'efface jusqu'au retour sur la loupe.
   */
  protected readonly focused = signal(this.doc.hasFocus?.() ?? false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const win = this.doc.defaultView;
      if (!win) return;
      const sync = () => this.focused.set(this.doc.hasFocus());
      win.addEventListener('focus', sync);
      win.addEventListener('blur', sync);
      destroyRef.onDestroy(() => {
        win.removeEventListener('focus', sync);
        win.removeEventListener('blur', sync);
      });
      sync();
      const stop = this.frames.add(() => {
        const zoom = pageZoom(win);
        const origin = contentOrigin(win, zoom);
        const peers = this.bus.windows.snapshot();
        for (const frame of Array.from(this.host.querySelectorAll<HTMLElement>('.frame'))) {
          const lens = peers.get(frame.dataset['lens'] ?? '');
          if (!lens || !isLens(lens)) continue;
          // Écart en pixels écran, ramené aux pixels CSS de cette fenêtre.
          const k = lens.pageZoom / zoom;
          frame.style.transform = `translate(${(lens.origin.x - origin.x) / zoom}px, ${(lens.origin.y - origin.y) / zoom}px)`;
          frame.style.width = `${lens.viewport.w * k}px`;
          frame.style.height = `${lens.viewport.h * k}px`;
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
