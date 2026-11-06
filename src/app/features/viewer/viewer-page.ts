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
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { FrameLoop } from '@core/dom/frame-loop';
import { observeResize } from '@core/dom/dom';
import { MotionPreference } from '@core/dom/motion-preference';
import { ViewerPresence } from '@core/sync/window-bus';
import { ThemeStore } from '@core/theme/theme.store';
import { TODAY } from '@core/time/time';
import { PROFILE } from '@domain/profile/profile.data';
import { projectLink } from '@domain/profile/projects';
import { AchievementsStore } from '@features/achievements/data/achievements.store';

import { DEFAULT_DEMO, DEMO_MODELS, DemoModel } from './data/demo-catalog';
import { MAX_OBJ_BYTES, checkObjFile, formatBytes, formatCount, formatSize, looksLikeObj, modelNameOf } from './data/obj-file';
import {
  DEFAULT_LIGHT,
  DEFAULT_TRANSFORM,
  FOV,
  LIGHT_SLIDERS,
  LightSettings,
  ModelRef,
  ModelTransform,
  SliderDef,
  TRANSFORM_SLIDERS,
  ViewerSettings,
  decimal,
  demoIdOf,
  demoKey,
  clampSlider,
  sameSettings,
} from './data/viewer-state';
import { ViewerSession } from './data/viewer-session';
import type { ModelInfo, ViewerColors, ViewerScene } from './scene/viewer-scene';

const nextFrame = (win: Window): Promise<void> => new Promise((resolve) => win.requestAnimationFrame(() => resolve()));

const createId = (): string => globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);

/**
 * Le visualiseur 3D, refait dans le portfolio : un modèle OBJ (importé ou d'exemple), une caméra
 * libre, des réglages de lumière et de position. Three.js n'est chargé qu'à l'ouverture de la page.
 *
 * Sur la vraie page, le visiteur manipule la scène et son état part avec la présence de la fenêtre.
 * Dans une loupe, la copie (`decorative`) reçoit cet état à chaque image (`sync`) et dessine la même
 * vue aux rayons X : l'enveloppe des objets s'efface et ce qu'elle cache apparaît.
 */
@Component({
  selector: 'app-viewer-page',
  imports: [RouterLink],
  templateUrl: './viewer-page.html',
  styleUrl: './viewer-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.xray]': "mode() === 'xray'",
    '[class.remote]': 'decorative()',
    '[attr.inert]': "decorative() ? '' : null",
    '[attr.aria-hidden]': "decorative() ? 'true' : null",
  },
})
export class ViewerPage {
  /** « xray » : la copie d'une loupe, ou toute la page après le code Konami. */
  readonly mode = input<'surface' | 'xray'>('surface');
  /** Copie dans une loupe : ni interactions, ni état propre. */
  readonly decorative = input(false);

  private readonly session = inject(ViewerSession);
  private readonly motion = inject(MotionPreference);
  private readonly theme = inject(ThemeStore);
  private readonly frames = inject(FrameLoop);
  private readonly achievements = inject(AchievementsStore);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly year = inject(TODAY).getFullYear();
  protected readonly projectPath = projectLink('visu3d');
  protected readonly demos = DEMO_MODELS;
  protected readonly lightSliders = LIGHT_SLIDERS;
  protected readonly transformSliders = TRANSFORM_SLIDERS;
  protected readonly maxSize = formatBytes(MAX_OBJ_BYTES);
  protected readonly fov = FOV;
  protected readonly count = formatCount;
  protected readonly decimal = decimal;
  protected readonly dims = formatSize;

  /** Réglages de la vraie page. */
  private readonly localModel = signal<ModelRef>({ key: demoKey(DEFAULT_DEMO.id), name: DEFAULT_DEMO.name });
  private readonly localLight = signal<LightSettings>(DEFAULT_LIGHT);
  private readonly localTransform = signal<ModelTransform>(DEFAULT_TRANSFORM);
  /** Réglages du portfolio, reçus par une copie de loupe (la caméra est appliquée à part). */
  private readonly remote = signal<ViewerSettings | null>(null, { equal: sameSettings });

  protected readonly model = computed<ModelRef>(() => {
    const remote = this.decorative() ? this.remote() : null;
    return remote ? { key: remote.model, name: remote.modelName } : this.localModel();
  });
  protected readonly light = computed(() => (this.decorative() ? this.remote()?.light : null) ?? this.localLight());
  protected readonly transform = computed(
    () => (this.decorative() ? this.remote()?.transform : null) ?? this.localTransform(),
  );
  protected readonly demoId = computed(() => demoIdOf(this.model().key));
  protected readonly autoRotate = signal(false);
  protected readonly info = signal<ModelInfo | null>(null);
  protected readonly status = signal('Chargement du moteur 3D…');
  protected readonly error = signal<string | null>(null);
  protected readonly dragging = signal(false);
  protected readonly unsupported = signal(false);

  protected readonly canvasLabel = computed(() => {
    const info = this.info();
    const name = this.model().name;
    if (!info) return `Modèle 3D « ${name} »`;
    return (
      `Modèle 3D « ${name} » : ${formatCount(info.objects)} objet${info.objects > 1 ? 's' : ''}, ` +
      `${formatCount(info.triangles)} triangles. Glisser pour tourner, molette pour zoomer, ` +
      'clic droit ou flèches du clavier pour déplacer.'
    );
  });

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('file');
  /** La scène existe (Three.js chargé) : les effets peuvent la régler. */
  private readonly ready = signal(false);
  private scene: ViewerScene | null = null;
  private loadedKey = '';
  /** Fichier attendu par une copie de loupe : la scène est vidée une seule fois. */
  private waitingKey = '';
  /** Grossissement de la copie dans la loupe, pour garder une image nette. */
  private scale = 1;
  private destroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.scene?.dispose();
      this.scene = null;
      if (!this.decorative()) this.session.publish(null);
    });
    effect(() => {
      const mode = this.mode();
      if (this.ready()) this.scene?.setMode(mode);
    });
    effect(() => {
      this.theme.theme();
      if (this.ready()) this.scene?.setColors(this.readColors());
    });
    effect(() => {
      const light = this.light();
      if (this.ready()) this.scene?.setLight(light);
    });
    effect(() => {
      const transform = this.transform();
      if (this.ready()) this.scene?.setTransform(transform);
    });
    effect(() => {
      const on = this.autoRotate();
      if (this.ready()) this.scene?.setAutoRotate(on);
    });
    effect(() => {
      const ref = this.model();
      // Dans une copie, le fichier arrive par le bus après l'état : on réessaie à son arrivée.
      if (this.decorative()) this.session.received();
      if (this.ready()) untracked(() => this.ensureModel(ref));
    });
    afterNextRender(() => void this.mount());
  }

  /**
   * Copie de loupe : recale la scène sur le portfolio, dans la même image que la page (appelé par
   * la loupe à chaque image, juste après avoir placé la copie).
   */
  sync(state: ViewerPresence | null, scale: number): void {
    if (!state) return;
    const { camera, ...settings } = state;
    this.remote.set(settings);
    if (Math.abs(scale - this.scale) > 0.05) {
      this.scale = scale;
      this.resize();
    }
    const scene = this.scene;
    if (!scene) return;
    scene.setCamera(camera);
    scene.setLight(settings.light);
    scene.setTransform(settings.transform);
    this.ensureModel({ key: settings.model, name: settings.modelName });
    scene.tick(0);
  }

  protected pickDemo(demo: DemoModel): void {
    this.error.set(null);
    this.localTransform.set(DEFAULT_TRANSFORM);
    this.localModel.set({ key: demoKey(demo.id), name: demo.name });
  }

  protected pickFile(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileChosen(event: Event): void {
    const field = event.target as HTMLInputElement;
    const file = field.files?.[0];
    // Le même fichier pourra être choisi de nouveau.
    field.value = '';
    if (file) void this.importFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    if (this.decorative() || !event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    const to = event.relatedTarget as Node | null;
    if (!to || !this.stage().nativeElement.contains(to)) this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.importFile(file);
  }

  protected setLight(def: SliderDef<keyof LightSettings>, event: Event): void {
    const value = clampSlider(def, Number((event.target as HTMLInputElement).value));
    this.localLight.update((light) => ({ ...light, [def.key]: value }));
  }

  protected setTransform(def: SliderDef<keyof ModelTransform>, event: Event): void {
    const value = clampSlider(def, Number((event.target as HTMLInputElement).value));
    this.localTransform.update((transform) => ({ ...transform, [def.key]: value }));
  }

  protected resetLight(): void {
    this.localLight.set(DEFAULT_LIGHT);
  }

  protected resetTransform(): void {
    this.localTransform.set(DEFAULT_TRANSFORM);
  }

  protected recenter(): void {
    this.scene?.resetCamera();
  }

  protected toggleAutoRotate(): void {
    this.autoRotate.update((on) => !on);
  }

  private async mount(): Promise<void> {
    const { ViewerScene } = await import('./scene/viewer-scene');
    if (this.destroyed) return;
    const decorative = this.decorative();
    const scene = new ViewerScene(this.canvas().nativeElement, {
      interactive: !decorative,
      reducedMotion: this.motion.reduced(),
      colors: this.readColors(),
      onInteract: () => this.autoRotate.set(false),
    });
    this.scene = scene;
    this.unsupported.set(!scene.renderer);
    this.status.set('');
    observeResize([this.stage().nativeElement], () => this.resize(), this.destroyRef);
    if (!decorative) {
      // Le modèle tourne doucement tant que personne n'y touche, sauf si le mouvement est réduit.
      this.autoRotate.set(!this.motion.reduced());
      const stop = this.frames.add((_now, dt) => {
        scene.tick(dt);
        this.session.publish(this.presence());
      });
      this.destroyRef.onDestroy(stop);
    }
    this.ready.set(true);
  }

  private resize(): void {
    const win = this.doc.defaultView;
    const stage = this.stage().nativeElement;
    if (!win || !stage.clientWidth || !stage.clientHeight) return;
    const ratio = Math.min(2.5, Math.max(1, (win.devicePixelRatio || 1) * this.scale));
    this.scene?.resize(stage.clientWidth, stage.clientHeight, Math.round(ratio * 100) / 100);
  }

  /** Charge le modèle demandé s'il n'est pas déjà affiché. */
  private ensureModel(ref: ModelRef): void {
    const scene = this.scene;
    if (!scene || ref.key === this.loadedKey) return;
    const demo = demoIdOf(ref.key);
    if (demo) {
      this.loadedKey = ref.key;
      this.info.set(scene.showDemo(ref.key, demo));
      if (!this.decorative()) scene.resetCamera();
      return;
    }
    // Sur la vraie page, un fichier est chargé au moment de l'import.
    if (!this.decorative()) return;
    const file = this.session.received();
    if (file?.key === ref.key) {
      this.loadedKey = ref.key;
      this.waitingKey = '';
      this.status.set('');
      try {
        this.info.set(scene.showObj(ref.key, file.text));
      } catch {
        scene.clear();
        this.info.set(null);
      }
      return;
    }
    if (this.waitingKey !== ref.key) {
      this.waitingKey = ref.key;
      scene.clear();
      this.info.set(null);
      this.status.set('Réception du fichier…');
    }
    this.session.request(ref.key, this.doc.defaultView?.performance.now() ?? 0);
  }

  private async importFile(file: File): Promise<void> {
    const win = this.doc.defaultView;
    const scene = this.scene;
    if (!win || !scene || this.decorative()) return;
    const problem = checkObjFile(file.name, file.size);
    if (problem) {
      this.error.set(problem);
      return;
    }
    this.error.set(null);
    this.status.set(`Lecture de « ${file.name} »…`);
    try {
      const text = await file.text();
      if (!looksLikeObj(text)) throw new Error('pas un OBJ');
      // Une image pour afficher « Lecture… » avant l'analyse, qui peut prendre un moment.
      await nextFrame(win);
      if (this.destroyed) return;
      const key = `file:${createId()}`;
      const name = modelNameOf(file.name);
      const info = scene.showObj(key, text);
      this.loadedKey = key;
      this.info.set(info);
      this.localTransform.set(DEFAULT_TRANSFORM);
      this.localModel.set({ key, name });
      scene.resetCamera();
      this.session.share({ key, name, text });
      this.achievements.unlock('modeliste');
    } catch {
      this.error.set(`« ${file.name} » ne contient pas de modèle OBJ lisible (sommets « v » et faces « f »).`);
    } finally {
      this.status.set('');
    }
  }

  /** L'état à annoncer aux loupes, ou null tant que rien n'est affiché. */
  private presence(): ViewerPresence | null {
    const scene = this.scene;
    if (!scene || !this.loadedKey) return null;
    const model = this.localModel();
    return {
      model: model.key,
      modelName: model.name,
      camera: scene.cameraState(),
      light: this.localLight(),
      transform: this.localTransform(),
    };
  }

  /** Les couleurs du thème actif, lues dans les variables CSS. */
  private readColors(): ViewerColors {
    const styles = this.doc.defaultView?.getComputedStyle(this.doc.documentElement);
    const read = (name: string, fallback: string): string => styles?.getPropertyValue(name).trim() || fallback;
    return {
      accent: read('--accent', '#4f46e5'),
      accent2: read('--accent-2', '#9333ea'),
      xl: read('--xl', '#7fe9ff'),
      xn: read('--xn', '#ffd84d'),
      xp: read('--xp', '#ff5bd0'),
    };
  }
}
