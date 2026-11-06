import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
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
import { ProjectsMirror } from '@features/page/projects/projects-mirror/projects-mirror';
import { ProjectPage } from '@features/project/project-page';
import { VIEWER_PATH } from '@features/viewer/data/viewer-state';
import { ViewerPage } from '@features/viewer/viewer-page';
import { SCAN_COVERAGE, ScanEngine } from '@features/secrets/data/scan-engine';
import { PROFILE } from '@domain/profile/profile.data';
import { SECRET_BY_ID } from '@features/secrets/data/secrets.catalog';
import { SecretsStore } from '@features/secrets/data/secrets.store';
import { ScanSparkles } from '@features/secrets/ui/scan-sparkles';
import { HuntClock, formatElapsed } from '@features/secrets/data/hunt-clock';
import { AchievementsStore } from '@features/achievements/data/achievements.store';
import { ThemeStore } from '@core/theme/theme.store';
import { SingularityOverlay } from '@features/singularity/singularity-overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { WindowRoleStore } from '../data/window-role.store';
import { GeigerAudio } from '../geiger-audio';
import { LensHud, LensState } from '../lens-hud/lens-hud';

/** Distance (px) en deçà de laquelle le détecteur commence à réagir. */
const DETECTOR_RANGE = 700;

/** Zoom de la loupe : de x0,5 (vue d'ensemble) à x3. */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** Zone du portfolio, en pixels écran. */
const mainRect = (m: MainPresence): Rect => ({
  x: m.origin.x,
  y: m.origin.y,
  w: m.layoutWidth * m.pageZoom,
  h: m.viewport.h * m.pageZoom,
});

const PROJECT_TITLES = new Map(PROFILE.projects.map((p) => [p.id, p.title]));

const round2 = (value: number): number => Math.round(value * 100) / 100;

const sameOverlay = (a: OverlayPresence | null, b: OverlayPresence | null): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    a.from === b.from &&
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
  imports: [PortfolioPage, LensHud, ProjectsMirror, ProjectPage, ViewerPage, SingularityOverlay, ScanSparkles],
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
      [class.hidden]="state() === 'searching' || projectId() !== null || viewerShown()"
    />
    <!-- Le portfolio visé est sur une page projet : la loupe affiche la copie de cette page. -->
    @if (projectId(); as id) {
      <app-project-page
        #projectCopy
        class="lens-page"
        mode="xray"
        [id]="id"
        [decorative]="true"
        [scrollY]="scrollY()"
        [style.width.px]="pageWidth()"
        [class.hidden]="state() === 'searching'"
      />
    }
    <!-- Le portfolio visé montre le visualiseur 3D : la copie dessine la même scène, aux rayons X. -->
    @if (viewerShown()) {
      <app-viewer-page
        #viewerCopy
        class="lens-page"
        mode="xray"
        [decorative]="true"
        [style.width.px]="pageWidth()"
        [class.hidden]="state() === 'searching'"
      />
    }
    <!-- Ce que le portfolio a ouvert par-dessus sa page, recopié en rayons X. -->
    <div class="overlay-layer" #overlayLayer [class.hidden]="state() === 'searching'" aria-hidden="true">
      @if (overlay(); as o) {
        <div class="overlay-backdrop" [style.width.px]="mainSize().w" [style.height.px]="mainSize().h" [style.opacity]="o.opacity"></div>
        <app-projects-mirror
          [from]="o.from"
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
      [elapsed]="elapsed()"
      (toggleSound)="toggleSound()"
      (resetZoom)="zoom.set(1)"
    />
    <app-scan-sparkles mode="reticle" [progress]="progress()" />
    <!-- Tous les secrets trouvés : la loupe devient elle aussi un trou noir, à côté du portfolio. -->
    @defer (when singularityOpen()) {
      @if (singularityOpen()) {
        <app-singularity-overlay (closed)="closeSingularity()" />
      }
    }
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
  private readonly projectCopy = viewChild('projectCopy', { read: ElementRef<HTMLElement> });
  private readonly viewerCopy = viewChild(ViewerPage);
  private readonly viewerCopyRef = viewChild(ViewerPage, { read: ElementRef<HTMLElement> });
  /** Projet affiché par le portfolio visé, ou null s'il est sur l'accueil. */
  protected readonly projectId = signal<string | null>(null);
  /** Le portfolio visé montre la démo du visualiseur 3D. */
  protected readonly viewerShown = signal(false);

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
  private scanElement: HTMLElement | null = null;
  private scanFocus: string | null = null;
  private scanProgress = 0;
  private konamiIndex = 0;
  private xrayAll = false;
  protected readonly singularityOpen = signal(false);
  private readonly hunt = inject(HuntClock);
  private readonly achievements = inject(AchievementsStore);
  protected readonly elapsed = computed(() => (this.hunt.elapsed() ? formatElapsed(this.hunt.elapsed()) : ''));
  private unlockOnKonami: (key: string) => void = () => undefined;
  private readonly audio = new GeigerAudio();
  private targetId: string | null = null;
  /** Taille d'un pixel du portfolio visé, en pixels de la loupe (zooms navigateur différents). */
  private ratio = 1;
  private frame = 0;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.doc.documentElement.classList.add('lens-mode');
    const destroyRef = inject(DestroyRef);
    this.watchAchievements();
    this.watchSingularity();

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
      scan: this.scanFocus ? { id: this.scanFocus, progress: this.scanProgress } : null,
    });

    if (!shown) {
      this.overlay.set(null);
      this.strength.set(0);
      this.progress.set(0);
      this.markScanning(null, 0);
      return;
    }

    const route = shown.route ?? '/';
    const viewer = route === VIEWER_PATH;
    const project = viewer ? null : (/^\/projets\/([^/?#]+)/.exec(route)?.[1] ?? null);
    this.projectId.set(project);
    this.viewerShown.set(viewer);
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
    const transform = lensTransform(offset, pivot, this.zoom(), k);
    this.pageRef().nativeElement.style.transform = transform;
    const copy = this.projectCopy()?.nativeElement;
    if (copy) copy.style.transform = transform;
    const viewerCopy = this.viewerCopyRef()?.nativeElement;
    if (viewerCopy) {
      viewerCopy.style.transform = transform;
      // La caméra du portfolio, dans la même image que la position de la copie.
      this.viewerCopy()?.sync(shown.viewer ?? null, this.zoom() * k);
    }

    // La modale est fixe dans la fenêtre portfolio : même décalage, sans le défilement.
    this.overlay.set(shown.overlay ?? null);
    this.mainSize.set({ w: shown.layoutWidth, h: shown.viewport.h });
    this.overlayLayer().nativeElement.style.transform = lensTransform(gap, pivot, this.zoom(), k);

    // Le visualiseur 3D regardé à travers la loupe : un succès.
    if (viewer && best) this.achievements.unlock('vision-3d');
    // Pas de secrets sur les pages projet : la loupe ne fait que montrer leur plan.
    if (!best || project || viewer) {
      if (project && this.frame++ % 20 === 0) this.section.set(PROJECT_TITLES.get(project) ?? null);
      if (viewer && this.frame++ % 20 === 0) this.section.set('Visualiseur 3D');
      this.strength.set(0);
      this.progress.set(0);
      this.markScanning(null, 0);
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
    this.markScanning(result.focus, result.progress);

    const strength = Number.isFinite(nearest) ? clamp(1 - nearest / DETECTOR_RANGE, 0, 1) : 0;
    this.strength.set(round2(strength));
    if (!this.muted()) this.audio.update(strength, dt);
  }

  /** Le secret analysé s'illumine peu à peu dans la copie (variable --scan, de 0 à 1). */
  private markScanning(id: string | null, progress: number): void {
    const element = id ? ((this.page().secretElements().get(id) as HTMLElement | undefined) ?? null) : null;
    if (this.scanElement && this.scanElement !== element) {
      this.scanElement.classList.remove('scanning');
      this.scanElement.style.removeProperty('--scan');
    }
    this.scanElement = element;
    this.scanFocus = element ? id : null;
    this.scanProgress = element ? round2(progress) : 0;
    if (element) {
      element.classList.add('scanning');
      element.style.setProperty('--scan', progress.toFixed(3));
    }
  }

  private reveal(id: string): void {
    this.store.markFound(id);
    this.page().flash(id);
    this.showToast(`Secret trouvé · ${SECRET_BY_ID.get(id)?.label ?? id}`);
  }

  private showToast(text: string): void {
    this.toast.set(text);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
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

  /**
   * La fin de la chasse ouvre la singularité dans les deux écrans : le portfolio et la loupe.
   * Le portfolio l'annonce sur le bus ; la loupe la déclenche aussi elle-même, au cas où.
   */
  private watchSingularity(): void {
    this.bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'singularity') this.singularityOpen.set(command.open);
    });
    let before = this.store.complete();
    effect((onCleanup) => {
      const complete = this.store.complete();
      if (complete && !before) {
        const timer = setTimeout(() => {
          this.singularityOpen.set(true);
          this.bus.send({ type: 'singularity', open: true });
        }, 1600);
        onCleanup(() => clearTimeout(timer));
      }
      before = complete;
    });
  }

  protected closeSingularity(): void {
    this.singularityOpen.set(false);
    this.bus.send({ type: 'singularity', open: false });
  }

  /** Les succès propres à la loupe, et l'annonce de tous les succès dans son viseur. */
  private watchAchievements(): void {
    const achievements = this.achievements;
    const theme = inject(ThemeStore);
    effect(() => {
      const zoom = this.zoom();
      achievements.noteZoom(zoom);
      if (zoom >= MAX_ZOOM - 0.001 || zoom <= MIN_ZOOM + 0.001) achievements.unlock('zoom-extreme');
    });
    effect(() => {
      if (theme.theme() === 'nuit') achievements.unlock('nuit-rayons-x');
    });
    effect(() => {
      const event = achievements.lastUnlocked();
      if (event) this.showToast(`Succès débloqué · ${event.def.label}`);
    });
    this.unlockOnKonami = (key) => {
      const k = key.length === 1 ? key.toLowerCase() : key;
      if (k === KONAMI[this.konamiIndex]) this.konamiIndex++;
      else this.konamiIndex = k === KONAMI[0] ? 1 : 0;
      if (this.konamiIndex === KONAMI.length) {
        this.konamiIndex = 0;
        achievements.unlock('konami-loupe');
        this.xrayAll = !this.xrayAll;
        this.bus.send({ type: 'xray-all', on: this.xrayAll });
        this.showToast(this.xrayAll ? 'Rayons X sur toute la page' : 'Retour à la surface');
      }
    };
  }

  private onKey(e: KeyboardEvent, win: Window): void {
    this.unlockOnKonami(e.key);
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
