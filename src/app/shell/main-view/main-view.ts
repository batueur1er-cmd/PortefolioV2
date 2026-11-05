import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FrameLoop } from '@core/dom/frame-loop';
import { contentOrigin, pageZoom } from '@core/geometry/geometry';
import { BusCommand, OverlayPresence, WindowBus } from '@core/sync/window-bus';
import { WindowRoleStore } from '@features/lens/data/window-role.store';
import { LensFrames } from '@features/lens/lens-frames/lens-frames';
import { PortfolioPage } from '@features/page/portfolio-page';
import { PROJECTS_DIALOG_PANEL } from '@features/page/projects/projects-dialog/projects-dialog';
import { SecretsStore } from '@features/secrets/data/secrets.store';
import { FoundToast } from '@features/secrets/ui/found-toast';
import { SingularityOverlay } from '@features/singularity/singularity-overlay';

import { ControlDock } from '../control-dock/control-dock';
import { CursorAura } from '../cursor-aura/cursor-aura';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** La fenêtre portfolio : la page en surface, et tout ce qui permet de la percer à jour. */
@Component({
  selector: 'app-main-view',
  imports: [PortfolioPage, LensFrames, ControlDock, FoundToast, SingularityOverlay, CursorAura],
  templateUrl: './main-view.html',
  styleUrl: './main-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class MainView {
  /** Défilement à restaurer, quand la fenêtre redevient portfolio après avoir été loupe. */
  readonly initialScroll = input(0);

  protected readonly store = inject(SecretsStore);
  private readonly bus = inject(WindowBus);
  private readonly roles = inject(WindowRoleStore);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly win = this.doc.defaultView;

  protected readonly vh = signal(this.win?.innerHeight ?? 800);
  protected readonly scrollY = signal(Math.round(this.win?.scrollY ?? 0));
  protected readonly singularityOpen = signal(false);
  protected readonly notice = signal<string | null>(null);
  private konamiIndex = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => this.onCommand(command));
    this.watchLenses();
    this.watchCompletion();

    afterNextRender(() => {
      const win = this.win;
      if (!win) return;
      if (this.initialScroll()) win.scrollTo({ top: this.initialScroll(), behavior: 'instant' });

      // Le défilement pilote les animations de la page ; on le relit une fois par image au plus.
      let pending = 0;
      const onScroll = () => {
        if (pending) return;
        pending = requestAnimationFrame(() => {
          pending = 0;
          this.scrollY.set(Math.round(win.scrollY));
        });
      };
      win.addEventListener('scroll', onScroll, { passive: true });

      // Chaque image, la fenêtre annonce où elle est, sa taille et son défilement.
      const stop = this.frames.add(() => {
        const zoom = pageZoom(win);
        this.bus.windows.publish({
          kind: 'main',
          id: this.bus.id,
          t: Date.now(),
          origin: contentOrigin(win, zoom),
          pageZoom: zoom,
          viewport: { w: win.innerWidth, h: win.innerHeight },
          small: this.roles.small(),
          layoutWidth: this.doc.documentElement.clientWidth,
          scroll: { x: win.scrollX, y: win.scrollY },
          route: '/',
          overlay: this.measureOverlay(),
        });
      });
      destroyRef.onDestroy(() => {
        stop();
        cancelAnimationFrame(pending);
        win.removeEventListener('scroll', onScroll);
      });
    });
  }

  /** La fenêtre « Tous les projets », si elle est ouverte, telle que la loupe doit la recopier. */
  private measureOverlay(): OverlayPresence | null {
    const surface = this.doc.querySelector<HTMLElement>(`.${PROJECTS_DIALOG_PANEL} .mat-mdc-dialog-surface`);
    if (!surface || !surface.offsetWidth) return null;
    const rect = surface.getBoundingClientRect();
    const content = surface.querySelector<HTMLElement>('.mat-mdc-dialog-content');
    const container = surface.closest<HTMLElement>('.mat-mdc-dialog-container');
    return {
      id: 'projects',
      cx: Math.round(rect.left + rect.width / 2),
      cy: Math.round(rect.top + rect.height / 2),
      w: surface.offsetWidth,
      h: surface.offsetHeight,
      scale: Math.round((rect.width / surface.offsetWidth) * 1000) / 1000,
      opacity: container ? Math.round(Number(getComputedStyle(container).opacity) * 100) / 100 : 1,
      contentHeight: content?.clientHeight ?? 0,
      contentTop: content ? Math.round(content.getBoundingClientRect().top - rect.top) : 0,
      scrollTop: Math.round(content?.scrollTop ?? 0),
    };
  }

  protected onResize(): void {
    this.vh.set(this.win?.innerHeight ?? 800);
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
      this.setSingularity(true, true);
    }
  }

  /** Le dernier secret trouvé ouvre la singularité : c'est la récompense, sans bouton. */
  private watchCompletion(): void {
    let before = this.store.complete();
    effect(() => {
      const complete = this.store.complete();
      if (complete && !before) setTimeout(() => this.setSingularity(true, true), 1600);
      before = complete;
    });
  }

  /** Annonce l'arrivée d'une loupe : quelqu'un vient de rétrécir une autre fenêtre. */
  private watchLenses(): void {
    let before = this.bus.otherLenses();
    effect(() => {
      const count = this.bus.otherLenses();
      if (count > before) this.notify('Une loupe vient de s’ouvrir : posez-la sur cette page.');
      before = count;
    });
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
