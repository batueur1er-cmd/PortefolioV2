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

import { FrameLoop } from '@core/dom/frame-loop';
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
  pageZoom,
} from '@core/geometry/geometry';
import { MainPresence, OverlayPresence, WindowBus, isMain } from '@core/sync/window-bus';
import { PortfolioPage } from '@features/page/portfolio-page';
import { ProjectsMirror } from '@features/page/projects/projects-mirror';
import { SCAN_COVERAGE, ScanEngine } from '@features/secrets/data/scan-engine';
import { SECRET_BY_ID } from '@features/secrets/data/secrets.catalog';
import { SecretsStore } from '@features/secrets/data/secrets.store';

import { WindowRoleStore } from './data/window-role.store';
import { GeigerAudio } from './geiger-audio';
import { LensHud, LensState } from './lens-hud';

/** Distance (px) en deçà de laquelle le détecteur commence à réagir. */
const DETECTOR_RANGE = 700;

/** Zoom de la loupe : de x0,5 (vue d'ensemble) à x3. */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

/** Zone du portfolio, en pixels écran. */
const mainRect = (m: MainPresence): Rect => ({
  x: m.origin.x,
  y: m.origin.y,
  w: m.layoutWidth * m.pageZoom,
  h: m.viewport.h * m.pageZoom,
});

const round2 = (value: number): number => Math.round(value * 100) / 100;

const sameOverlay = (a: OverlayPresence | null, b: OverlayPresence | null): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    a.cx === b.cx &&
    a.cy === b.cy &&
    a.w === b.w &&
    a.h === b.h &&
    a.scale === b.scale &&
    a.opacity === b.opacity &&
    a.contentHeight === b.contentHeight &&
    a.contentTop === b.contentTop &&
    a.scrollTop === b.scrollTop);

/**
 * La fenêtre loupe. Elle affiche la même page en rayons X, à la largeur du portfolio,
 * décalée de l'écart entre les deux fenêtres : posée dessus, elle semble transparente.
 */
@Component({
  selector: 'app-lens-view',
  imports: [PortfolioPage, LensHud, ProjectsMirror],
  template: `
    <app-portfolio-page
      class="lens-page"
      mode="xray"
      aria-hidden="true"
      [decorative]="true"
      [remote]="true"
      [vh]="vh()"
      [scrollY]="scrollY()"
      [style.width.px]="pageWidth()"
      [class.hidden]="state() === 'searching'"
    />
    <!-- Ce que le portfolio a ouvert par-dessus sa page, recopié en rayons X. -->
    <div class="overlay-layer" #overlayLayer [class.hidden]="state() === 'searching'" aria-hidden="true">
      @if (overlay(); as o) {
        <div class="overlay-backdrop" [style.width.px]="mainSize().w" [style.height.px]="mainSize().h" [style.opacity]="o.opacity"></div>
        <app-projects-mirror
          [scrollTop]="o.scrollTop"
          [contentHeight]="o.contentHeight"
          [contentTop]="o.contentTop"
          [style.left.px]="o.cx - o.w / 2"
          [style.top.px]="o.cy - o.h / 2"
          [style.width.px]="o.w"
          [style.height.px]="o.h"
          [style.opacity]="o.opacity"
          [style.transform]="'scale(' + o.scale + ')'"
        />
      }
    </div>
    <app-lens-hud
      [zoom]="zoom()"
      [found]="store.count()"
      [total]="store.total"
      [strength]="strength()"
      [progress]="progress()"
      [state]="state()"
      [section]="section()"
      [muted]="muted()"
      [toast]="toast()"
      (toggleSound)="toggleSound()"
    />
  `,
  styleUrl: './lens-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LensView {
  protected readonly store = inject(SecretsStore);
  private readonly bus = inject(WindowBus);
  private readonly roles = inject(WindowRoleStore);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly page = viewChild.required(PortfolioPage);
  private readonly pageRef = viewChild.required(PortfolioPage, { read: ElementRef<HTMLElement> });
  private readonly overlayLayer = viewChild.required<ElementRef<HTMLElement>>('overlayLayer');

  protected readonly zoom = signal(1);
  protected readonly vh = signal(800);
  protected readonly scrollY = signal(0);
  protected readonly pageWidth = signal(1200);
  protected readonly state = signal<LensState>('searching');
  protected readonly section = signal<string | null>(null);
  protected readonly strength = signal(0);
  protected readonly progress = signal(0);
  protected readonly muted = signal(true);
  protected readonly toast = signal<string | null>(null);
  /** Fenêtre modale ouverte sur le portfolio visé, et taille de ce portfolio. */
  protected readonly overlay = signal<OverlayPresence | null>(null, { equal: sameOverlay });
  protected readonly mainSize = signal({ w: 0, h: 0 }, { equal: (a, b) => a.w === b.w && a.h === b.h });

  private readonly scanner = new ScanEngine();
  private readonly audio = new GeigerAudio();
  private targetId: string | null = null;
  /** Taille d'un pixel du portfolio visé, en pixels de la loupe (zooms navigateur différents). */
  private ratio = 1;
  private frame = 0;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
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
    const zoom = pageZoom(win);
    const origin = contentOrigin(win, zoom);
    // En pixels écran, pour comparer avec les autres fenêtres.
    const viewport: Rect = { x: origin.x, y: origin.y, w: win.innerWidth * zoom, h: win.innerHeight * zoom };

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
      viewport: { w: win.innerWidth, h: win.innerHeight },
      small: this.roles.small(),
      pageZoom: zoom,
      zoom: this.zoom(),
      target: this.targetId,
      section: this.section(),
    });

    if (!shown) {
      this.overlay.set(null);
      this.strength.set(0);
      this.progress.set(0);
      return;
    }

    this.pageWidth.set(shown.layoutWidth);
    this.vh.set(shown.viewport.h);
    this.scrollY.set(Math.round(shown.scroll.y));
    // Tout est ramené aux pixels CSS de la loupe : écarts écran divisés par son zoom navigateur,
    // pixels du portfolio multipliés par le rapport des deux zooms.
    const k = shown.pageZoom / zoom;
    this.ratio = k;
    const pivot: Point = { x: win.innerWidth / 2, y: win.innerHeight / 2 };
    const gap: Point = { x: (shown.origin.x - origin.x) / zoom, y: (shown.origin.y - origin.y) / zoom };
    const offset: Point = { x: gap.x - shown.scroll.x * k, y: gap.y - shown.scroll.y * k };
    this.pageRef().nativeElement.style.transform = lensTransform(offset, pivot, this.zoom(), k);

    // La modale est fixe dans la fenêtre portfolio : même décalage, sans le défilement.
    this.overlay.set(shown.overlay ?? null);
    this.mainSize.set({ w: shown.layoutWidth, h: shown.viewport.h });
    this.overlayLayer().nativeElement.style.transform = lensTransform(gap, pivot, this.zoom(), k);

    if (!best) {
      this.strength.set(0);
      this.progress.set(0);
      return;
    }
    // La détection mesure le DOM : une image sur deux suffit largement.
    if (++this.frame % 2) return;
    if (this.frame % 20 === 0) this.section.set(this.sectionAt((pivot.y - offset.y) / k));
    const zone = intersect(
      { x: 0, y: 0, w: win.innerWidth, h: win.innerHeight },
      {
        x: (best.origin.x - origin.x) / zoom,
        y: (best.origin.y - origin.y) / zoom,
        w: best.layoutWidth * (best.pageZoom / zoom),
        h: best.viewport.h * (best.pageZoom / zoom),
      },
    );
    this.scan(zone, pivot, dt * 2);
  }

  /** Section de la page sous une ordonnée (coordonnées de la page). */
  private sectionAt(y: number): string | null {
    let label: string | null = null;
    for (const section of this.page().sections()) {
      if (section.top <= y) label = section.label;
    }
    return label;
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
      this.zoom.update((z) => clamp(z * Math.exp(-delta * 0.0015), MIN_ZOOM, MAX_ZOOM));
    } else if (this.targetId) {
      // La molette fait défiler le portfolio sous la loupe.
      this.bus.send({ type: 'scroll', target: this.targetId, dy: delta / this.ratio });
    }
  }

  private onKey(e: KeyboardEvent, win: Window): void {
    const page = win.innerHeight * 0.8;
    switch (e.key) {
      case '+':
      case '=':
        this.zoom.update((z) => clamp(z * 1.15, MIN_ZOOM, MAX_ZOOM));
        break;
      case '-':
        this.zoom.update((z) => clamp(z / 1.15, MIN_ZOOM, MAX_ZOOM));
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
