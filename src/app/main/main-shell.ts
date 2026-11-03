import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FrameLoop } from '../core/frame-loop';
import { contentOrigin } from '../core/geometry';
import { SecretsStore } from '../core/secrets.store';
import { BusCommand, WindowBus } from '../core/window-bus';
import { PortfolioPage } from '../portfolio/portfolio-page';
import { SingularityOverlay } from '../singularity/singularity-overlay';
import { ControlDock } from './control-dock';
import { FoundToast } from './found-toast';
import { InpageLens } from './inpage-lens';
import { LensFrames } from './lens-frames';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** La fenêtre principale : le portfolio en surface, et tout ce qui permet de le percer à jour. */
@Component({
  selector: 'app-main-shell',
  imports: [PortfolioPage, InpageLens, LensFrames, ControlDock, FoundToast, SingularityOverlay],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class MainShell {
  protected readonly store = inject(SecretsStore);
  private readonly bus = inject(WindowBus);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly win = this.doc.defaultView;

  protected readonly vh = signal(this.win?.innerHeight ?? 800);
  protected readonly inpageLens = signal(false);
  protected readonly xrayView = signal(false);
  protected readonly singularityOpen = signal(false);
  protected readonly notice = signal<string | null>(null);
  private readonly cheat = signal(false);
  protected readonly singularityAvailable = computed(() => this.store.complete() || this.cheat());
  private konamiIndex = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => this.onCommand(command));

    afterNextRender(() => {
      const win = this.win;
      if (!win) return;
      // Chaque image, la fenêtre annonce où elle est et où elle en est de son défilement.
      const stop = this.frames.add(() =>
        this.bus.windows.publish({
          kind: 'main',
          id: this.bus.id,
          t: Date.now(),
          origin: contentOrigin(win),
          layoutWidth: this.doc.documentElement.clientWidth,
          viewportHeight: win.innerHeight,
          scroll: { x: win.scrollX, y: win.scrollY },
        }),
      );
      destroyRef.onDestroy(stop);
    });
  }

  protected onResize(): void {
    this.vh.set(this.win?.innerHeight ?? 800);
  }

  protected openLensWindow(): void {
    const win = this.win;
    if (!win) return;
    const width = 480;
    const height = 380;
    const left = Math.round(win.screenX + (win.outerWidth - width) / 2);
    const top = Math.round(win.screenY + Math.min(240, (win.outerHeight - height) / 2));
    const url = new URL(win.location.href);
    url.search = '?loupe';
    url.hash = '';
    const popup = win.open(
      url.toString(),
      `pv2-loupe-${Date.now()}`,
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );
    if (!popup) {
      this.inpageLens.set(true);
      this.notify('Fenêtre bloquée par le navigateur : la loupe intégrée prend le relais.');
    }
  }

  protected toggleInpage(): void {
    this.inpageLens.update((open) => !open);
    if (this.inpageLens()) this.xrayView.set(false);
  }

  protected toggleXray(): void {
    this.xrayView.update((open) => !open);
    if (this.xrayView()) {
      this.inpageLens.set(false);
      this.notify('Vue rayons X : tout est visible, mais les secrets ne comptent pas.');
    }
  }

  protected setSingularity(open: boolean, broadcast: boolean): void {
    this.singularityOpen.set(open);
    if (broadcast) this.bus.send({ type: 'singularity', open });
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[this.konamiIndex]) this.konamiIndex++;
    else this.konamiIndex = key === KONAMI[0] ? 1 : 0;
    if (this.konamiIndex === KONAMI.length) {
      this.konamiIndex = 0;
      this.cheat.set(true);
      this.setSingularity(true, true);
    } else if (key === 'Escape' && this.inpageLens()) {
      this.inpageLens.set(false);
    }
  }

  private onCommand(command: BusCommand): void {
    if (command.type === 'scroll' && command.target === this.bus.id) {
      this.win?.scrollBy({ top: command.dy, behavior: 'instant' });
    } else if (command.type === 'singularity') {
      this.setSingularity(command.open, false);
    }
  }

  private notify(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(null), 4000);
  }
}
