import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { FrameLoop } from '../core/frame-loop';
import {
  Point,
  Rect,
  clamp,
  contentOrigin,
  coverage,
  distanceToRect,
  fromDomRect,
  intersect,
  lensTransform,
  overlapArea,
} from '../core/geometry';
import { SCAN_COVERAGE, ScanEngine } from '../core/scan-engine';
import { SECRET_BY_ID } from '../core/secrets.catalog';
import { SecretsStore } from '../core/secrets.store';
import { MainPresence, WindowBus, isMain } from '../core/window-bus';
import { PortfolioPage } from '../portfolio/portfolio-page';
import { GeigerAudio } from './geiger-audio';
import { LensHud, LensState } from './lens-hud';

/** Distance (px) en deçà de laquelle le détecteur commence à réagir. */
const DETECTOR_RANGE = 700;

const mainRect = (m: MainPresence): Rect => ({
  x: m.origin.x,
  y: m.origin.y,
  w: m.layoutWidth,
  h: m.viewportHeight,
});

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * La fenêtre loupe. Elle affiche la même page en rayons X, à la largeur du portfolio,
 * décalée de l'écart entre les deux fenêtres : posée dessus, elle semble transparente.
 */
@Component({
  selector: 'app-lens-shell',
  imports: [PortfolioPage, LensHud],
  template: `
    <app-portfolio-page
      class="lens-page"
      mode="xray"
      aria-hidden="true"
      [decorative]="true"
      [vh]="vh()"
      [style.width.px]="pageWidth()"
      [class.hidden]="state() === 'searching'"
    />
    <app-lens-hud
      [zoom]="zoom()"
      [found]="store.count()"
      [total]="store.total"
      [strength]="strength()"
      [progress]="progress()"
      [state]="state()"
      [muted]="muted()"
      [toast]="toast()"
      (toggleSound)="toggleSound()"
    />
  `,
  styleUrl: './lens-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LensShell {
  protected readonly store = inject(SecretsStore);
  private readonly bus = inject(WindowBus);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly page = viewChild.required(PortfolioPage);
  private readonly pageRef = viewChild.required(PortfolioPage, { read: ElementRef<HTMLElement> });

  protected readonly zoom = signal(1);
  protected readonly vh = signal(800);
  protected readonly pageWidth = signal(1200);
  protected readonly state = signal<LensState>('searching');
  protected readonly strength = signal(0);
  protected readonly progress = signal(0);
  protected readonly muted = signal(true);
  protected readonly toast = signal<string | null>(null);

  private readonly scanner = new ScanEngine();
  private readonly audio = new GeigerAudio();
  private targetId: string | null = null;
  private frame = 0;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.bus.role.set('lens');
    this.doc.documentElement.classList.add('lens-mode');
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const win = this.doc.defaultView;
      if (!win) return;
      const onWheel = (e: WheelEvent) => this.onWheel(e, win);
      const onKey = (e: KeyboardEvent) => this.onKey(e, win);
      win.addEventListener('wheel', onWheel, { passive: false });
      win.addEventListener('keydown', onKey);
      const stop = this.frames.add((_now, dt) => this.tick(win, dt));

      destroyRef.onDestroy(() => {
        stop();
        win.removeEventListener('wheel', onWheel);
        win.removeEventListener('keydown', onKey);
        clearTimeout(this.toastTimer);
        this.audio.close();
        this.doc.documentElement.classList.remove('lens-mode');
      });
    });
  }

  protected toggleSound(): void {
    this.muted.update((muted) => !muted);
    if (this.muted()) this.audio.disable();
    else this.audio.enable();
  }

  private tick(win: Window, dt: number): void {
    const now = Date.now();
    const origin = contentOrigin(win);
    const viewport: Rect = { x: origin.x, y: origin.y, w: win.innerWidth, h: win.innerHeight };

    // Le portfolio visé est celui que la loupe recouvre le plus.
    const mains = [...this.bus.windows.snapshot(now).values()].filter(isMain);
    let best: MainPresence | null = null;
    let bestArea = 0;
    for (const main of mains) {
      const a = overlapArea(viewport, mainRect(main));
      if (a > bestArea) {
        bestArea = a;
        best = main;
      }
    }
    const shown = best ?? mains.reduce<MainPresence | null>((acc, m) => (!acc || m.t > acc.t ? m : acc), null);
    this.targetId = best?.id ?? null;
    this.state.set(best ? 'on' : mains.length ? 'off' : 'searching');

    this.bus.windows.publish({
      kind: 'lens',
      id: this.bus.id,
      t: now,
      origin,
      size: { w: viewport.w, h: viewport.h },
      zoom: this.zoom(),
      target: this.targetId,
    });

    if (!shown) {
      this.strength.set(0);
      this.progress.set(0);
      return;
    }

    this.pageWidth.set(shown.layoutWidth);
    this.vh.set(shown.viewportHeight);
    const pivot: Point = { x: viewport.w / 2, y: viewport.h / 2 };
    const offset: Point = {
      x: shown.origin.x - origin.x - shown.scroll.x,
      y: shown.origin.y - origin.y - shown.scroll.y,
    };
    this.pageRef().nativeElement.style.transform = lensTransform(offset, pivot, this.zoom());

    if (!best) {
      this.strength.set(0);
      this.progress.set(0);
      return;
    }
    // La détection mesure le DOM : une image sur deux suffit largement.
    if (++this.frame % 2) return;
    const zone = intersect(
      { x: 0, y: 0, w: viewport.w, h: viewport.h },
      { x: best.origin.x - origin.x, y: best.origin.y - origin.y, w: best.layoutWidth, h: best.viewportHeight },
    );
    this.scan(zone, pivot, dt * 2);
  }

  /** Analyse les secrets sous la zone où la loupe recouvre vraiment le portfolio. */
  private scan(zone: Rect | null, pivot: Point, dt: number): void {
    const found = this.store.found();
    const candidates = new Set<string>();
    let nearest = Infinity;
    for (const [id, element] of this.page().secretElements()) {
      if (found.has(id)) continue;
      const rect = fromDomRect(element.getBoundingClientRect());
      if (rect.w === 0 && rect.h === 0) continue;
      nearest = Math.min(nearest, distanceToRect(pivot, rect));
      if (zone && coverage(rect, zone) >= SCAN_COVERAGE) candidates.add(id);
    }

    const result = this.scanner.step(candidates, dt);
    for (const id of result.completed) this.reveal(id);
    this.progress.set(round2(result.progress));

    const strength = Number.isFinite(nearest) ? clamp(1 - nearest / DETECTOR_RANGE, 0, 1) : 0;
    this.strength.set(round2(strength));
    if (!this.muted()) this.audio.update(strength, dt);
  }

  private reveal(id: string): void {
    this.store.markFound(id);
    this.page().flash(id);
    this.showToast(`Secret trouvé · ${SECRET_BY_ID.get(id)?.label ?? id}`);
  }

  private showToast(text: string): void {
    this.toast.set(text);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 1800);
  }

  private onWheel(e: WheelEvent, win: Window): void {
    e.preventDefault();
    const raw = e.deltaY || e.deltaX;
    const delta = raw * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? win.innerHeight : 1);
    if (e.shiftKey || e.ctrlKey || e.altKey) {
      this.zoom.update((z) => clamp(z * Math.exp(-delta * 0.0015), 1, 3));
    } else if (this.targetId) {
      // La molette fait défiler le portfolio sous la loupe.
      this.bus.send({ type: 'scroll', target: this.targetId, dy: delta });
    }
  }

  private onKey(e: KeyboardEvent, win: Window): void {
    const page = win.innerHeight * 0.8;
    switch (e.key) {
      case '+':
      case '=':
        this.zoom.update((z) => clamp(z * 1.15, 1, 3));
        break;
      case '-':
        this.zoom.update((z) => clamp(z / 1.15, 1, 3));
        break;
      case '0':
        this.zoom.set(1);
        break;
      case 'm':
      case 'M':
        this.toggleSound();
        break;
      case 'ArrowDown':
        this.scrollTarget(80);
        break;
      case 'ArrowUp':
        this.scrollTarget(-80);
        break;
      case 'PageDown':
      case ' ':
        this.scrollTarget(page);
        break;
      case 'PageUp':
        this.scrollTarget(-page);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  private scrollTarget(dy: number): void {
    if (this.targetId) this.bus.send({ type: 'scroll', target: this.targetId, dy });
  }
}
