import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

import { offsetWithin, safeStorage } from '@core/dom/dom';
import { FrameLoop } from '@core/dom/frame-loop';
import { MotionPreference } from '@core/dom/motion-preference';
import { ThemeStore } from '@core/theme/theme.store';
import { PROFILE } from '@domain/profile/profile.data';
import { PROJECTS_ON_PAGE } from '@domain/profile/projects';
import { ScrollStage } from '@shared/motion/scroll-stage';

import { PageContext } from '../page-context';
import { SectionBox, litSkills, starMap } from './constellation';
import type { ScrollModelColors, ScrollModelScene } from './scroll-model-scene';
import { ModelForm, modelPose, parseForm } from './scroll-model.pose';

/** Sous cette largeur de page, rien : la forme passerait sur le texte, et un téléphone n'a pas à la payer. */
const MIN_PAGE_WIDTH = 900;
/** Three.js ne se charge qu'une fois la page affichée. */
const LOAD_DELAY_MS = 800;
/** La forme retenue, gardée pour que toutes les fenêtres, loupes comprises, montrent la même. */
const FORM_KEY = 'pv2.forme';

/**
 * Une forme discrète en traits fins, derrière le contenu, qui suit la descente de la page. Tout
 * dépend du seul défilement de `ScrollStage` : la copie d'une loupe calcule donc la même image.
 */
@Component({
  selector: 'app-scroll-model',
  template: `<canvas #canvas class="model" aria-hidden="true"></canvas>`,
  styleUrl: './scroll-model.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollModel {
  private readonly stage = inject(ScrollStage);
  private readonly page = inject(PageContext);
  private readonly frames = inject(FrameLoop);
  private readonly theme = inject(ThemeStore);
  private readonly motion = inject(MotionPreference);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private form: ModelForm = this.readForm();
  private scene: ScrollModelScene | null = null;
  private loading = false;
  private destroyed = false;
  private lastKey = '';
  private lastTheme: string | null = null;
  private lastSide = 0;
  private pageHeight = 0;
  private sections: SectionBox[] = [];
  private layoutSeen = -1;

  constructor() {
    afterNextRender(() => {
      const win = this.doc.defaultView;
      const onStorage = (event: StorageEvent) => {
        if (event.key !== FORM_KEY) return;
        this.form = parseForm(event.newValue) ?? this.form;
        this.lastKey = '';
      };
      win?.addEventListener('storage', onStorage);
      const timer = setTimeout(() => {
        const stop = this.frames.add(() => this.tick());
        this.destroyRef.onDestroy(stop);
      }, LOAD_DELAY_MS);
      this.destroyRef.onDestroy(() => {
        this.destroyed = true;
        clearTimeout(timer);
        win?.removeEventListener('storage', onStorage);
        this.scene?.dispose();
      });
    });
  }

  /** `?forme=bn` ou `?forme=constellation` dans l'adresse choisit, et la fenêtre s'en souvient. */
  private readForm(): ModelForm {
    const win = this.doc.defaultView;
    const storage = safeStorage(win);
    const asked = parseForm(new URLSearchParams(win?.location.search ?? '').get('forme'));
    try {
      if (asked) storage?.setItem(FORM_KEY, asked);
      return asked ?? parseForm(storage?.getItem(FORM_KEY)) ?? 'constellation';
    } catch {
      return asked ?? 'constellation';
    }
  }

  private tick(): void {
    const element = this.stage.element;
    const canvas = this.canvas().nativeElement;
    const width = element.clientWidth;
    if (width < MIN_PAGE_WIDTH || this.motion.reduced()) {
      canvas.style.opacity = '0';
      this.lastKey = '';
      return;
    }
    if (!this.scene) {
      void this.load(canvas);
      return;
    }
    const layout = this.stage.layout();
    if (layout !== this.layoutSeen) {
      this.layoutSeen = layout;
      this.pageHeight = element.offsetHeight;
      this.sections = Array.from(element.querySelectorAll<HTMLElement>('[data-section]'), (el) => ({
        id: el.dataset['section'] ?? '',
        top: offsetWithin(el, element).y,
      }));
      this.lastKey = '';
    }
    const scrollY = this.stage.scrollY();
    const vh = this.stage.vh();
    const xray = this.page.mode() === 'xray';
    const theme = this.theme.theme();
    const key = `${this.form}|${scrollY}|${vh}|${width}|${this.pageHeight}|${xray}|${theme}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    if (theme !== this.lastTheme) {
      this.lastTheme = theme;
      this.scene.setColors(this.readColors());
    }
    this.scene.setXray(xray);
    const pose = modelPose(this.form, scrollY, vh, width, this.pageHeight);
    if (pose.side !== this.lastSide) {
      this.lastSide = pose.side;
      canvas.style.width = canvas.style.height = `${pose.side}px`;
      this.scene.resize(pose.side, Math.min(2, this.doc.defaultView?.devicePixelRatio ?? 1));
    }
    canvas.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0)`;
    canvas.style.opacity = String(pose.appear);
    if (pose.appear > 0) this.scene.draw(this.form, pose, litSkills(PROFILE, PROJECTS_ON_PAGE, this.sections, scrollY + vh / 2));
  }

  private async load(canvas: HTMLCanvasElement): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    try {
      const { ScrollModelScene: Scene } = await import('./scroll-model-scene');
      if (!this.destroyed) this.scene = new Scene(canvas, starMap(PROFILE));
    } catch {
      // Pas de WebGL : la page reste entière, sans la forme.
    }
  }

  /** Les couleurs du thème, lues à la racine : la copie aux rayons X y redéfinit certaines teintes sur sa page. */
  private readColors(): ScrollModelColors {
    const styles = this.doc.defaultView?.getComputedStyle(this.doc.documentElement);
    const read = (name: string, fallback: string) => styles?.getPropertyValue(name).trim() || fallback;
    return {
      dim: read('--muted', '#4b5563'),
      lit: read('--accent', '#4f46e5'),
      xrayLine: read('--xl', '#7fe9ff'),
      xrayNote: read('--xn', '#ffd84d'),
      xrayPink: read('--xp', '#ff5bd0'),
    };
  }
}
