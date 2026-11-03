import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { FrameLoop } from '../core/frame-loop';
import { Point, circleCoverage, clamp, fromDomRect } from '../core/geometry';
import { SCAN_COVERAGE, ScanEngine } from '../core/scan-engine';
import { SecretsStore } from '../core/secrets.store';
import { PortfolioPage } from '../portfolio/portfolio-page';

/**
 * Loupe intégrée, pour une seule fenêtre ou un écran tactile : un second exemplaire de la page,
 * en rayons X, posé exactement sur le premier et découpé en cercle autour du pointeur.
 */
@Component({
  selector: 'app-inpage-lens',
  imports: [PortfolioPage],
  templateUrl: './inpage-lens.html',
  styleUrl: './inpage-lens.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class InpageLens {
  readonly vh = input(800);
  readonly closed = output<void>();

  private readonly store = inject(SecretsStore);
  private readonly frames = inject(FrameLoop);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly page = viewChild.required(PortfolioPage);
  private readonly pageRef = viewChild.required(PortfolioPage, { read: ElementRef<HTMLElement> });
  private readonly ring = viewChild.required<ElementRef<HTMLElement>>('ring');

  protected readonly progress = signal(0);
  protected readonly zoom = signal(1);
  protected readonly zoomLabel = computed(() => this.zoom().toFixed(1).replace('.', ','));

  private readonly scanner = new ScanEngine();
  private target: Point;
  private position: Point;
  private dragging = false;
  private frame = 0;

  constructor() {
    const win = this.doc.defaultView;
    this.target = this.position = { x: (win?.innerWidth ?? 800) / 2, y: (win?.innerHeight ?? 600) / 2 };
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (!win) return;
      const ring = this.ring().nativeElement;
      // Souris : la loupe suit le curseur. Doigt ou stylet : on la fait glisser.
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === 'mouse' || this.dragging) this.target = { x: e.clientX, y: e.clientY };
      };
      const onDown = (e: PointerEvent) => {
        if (e.pointerType === 'mouse') return;
        this.dragging = true;
        ring.setPointerCapture(e.pointerId);
        this.target = { x: e.clientX, y: e.clientY };
      };
      const onUp = () => (this.dragging = false);
      const onWheel = (e: WheelEvent) => {
        if (!e.shiftKey) return;
        e.preventDefault();
        const delta = e.deltaY || e.deltaX;
        this.zoom.update((z) => clamp(z * Math.exp(-delta * 0.0015), 1, 3));
      };

      this.doc.addEventListener('pointermove', onMove, { passive: true });
      ring.addEventListener('pointerdown', onDown);
      ring.addEventListener('pointerup', onUp);
      ring.addEventListener('pointercancel', onUp);
      win.addEventListener('wheel', onWheel, { passive: false });
      const stop = this.frames.add((_now, dt) => this.tick(win, dt));

      destroyRef.onDestroy(() => {
        stop();
        this.doc.removeEventListener('pointermove', onMove);
        ring.removeEventListener('pointerdown', onDown);
        ring.removeEventListener('pointerup', onUp);
        ring.removeEventListener('pointercancel', onUp);
        win.removeEventListener('wheel', onWheel);
      });
    });
  }

  private tick(win: Window, dt: number): void {
    // Léger retard sur le pointeur : la loupe a un peu de poids.
    this.position = {
      x: this.position.x + (this.target.x - this.position.x) * 0.35,
      y: this.position.y + (this.target.y - this.position.y) * 0.35,
    };
    const { x, y } = this.position;
    const radius = win.innerWidth < 640 ? 100 : 150;
    const stage = this.host.getBoundingClientRect();
    const lx = x - stage.left;
    const ly = y - stage.top;
    const zoom = this.zoom();

    this.host.style.setProperty('--r', `${radius}px`);
    this.host.style.setProperty('--x', `${lx}px`);
    this.host.style.setProperty('--y', `${ly}px`);
    this.pageRef().nativeElement.style.transform =
      zoom === 1 ? '' : `translate(${lx}px, ${ly}px) scale(${zoom}) translate(${-lx}px, ${-ly}px)`;
    this.ring().nativeElement.style.transform = `translate(${x - radius}px, ${y - radius}px)`;

    if (++this.frame % 2) return;
    const found = this.store.found();
    const candidates = new Set<string>();
    for (const [id, element] of this.page().secretElements()) {
      if (found.has(id)) continue;
      const rect = fromDomRect(element.getBoundingClientRect());
      if (circleCoverage(rect, this.position, radius) >= SCAN_COVERAGE) candidates.add(id);
    }
    const result = this.scanner.step(candidates, dt * 2);
    for (const id of result.completed) {
      this.store.markFound(id);
      this.page().flash(id);
    }
    this.progress.set(Math.round(result.progress * 100) / 100);
  }
}
