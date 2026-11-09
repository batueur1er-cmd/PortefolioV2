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
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { FrameLoop } from '@core/dom/frame-loop';
import { observeResize } from '@core/dom/dom';
import { MotionPreference } from '@core/dom/motion-preference';
import { DoomPresence } from '@core/sync/window-bus';
import { ThemeStore } from '@core/theme/theme.store';
import { TODAY } from '@core/time/time';
import { PROFILE } from '@domain/profile/profile.data';
import { projectLink } from '@domain/profile/projects';
import { AchievementsStore } from '@features/achievements/data/achievements.store';

import { DoomSession } from './data/doom-session';
import {
  DOOM_PROJECT,
  FrameCounts,
  NO_COUNTS,
  PadAction,
  REPLAY_MS,
  ReplayPhase,
  ReplayState,
  countsOf,
  heading,
  phaseOf,
  sameCounts,
  sameDoom,
} from './data/doom-state';
import {
  DEFAULT_FOV,
  DoomEngine,
  Doors,
  FrameResult,
  MAX_FOV,
  MIN_FOV,
  MapColors,
  Player,
  PlayerInput,
  RAMP_COLORS,
  Rgb,
  SCREEN_H,
  SCREEN_W,
  TIC_MS,
  View,
  XrayColors,
  drawMap,
  mapFrame,
  mapToWorld,
  parseColor,
  subsectorAt,
} from './engine/engine';
import { DoomControls } from './ui/doom-controls/doom-controls';
import { DoomSteps } from './ui/doom-steps/doom-steps';

/** Les touches de déplacement, par leur place sur le clavier (Z Q S D en AZERTY, W A S D en QWERTY). */
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
/** Un appui au clavier sur une touche du pavé fait marcher quelques tics. */
const NUDGE_TICS = 6;
/** Espace ou E : la touche « utiliser » de Doom. */
const USE_KEYS = new Set(['Space', 'KeyE']);
/** Rotation quand on glisse sur la vue, en radians par pixel. */
const DRAG_TURN = 0.008;

interface Colors {
  readonly ramps: Rgb[];
  readonly surface: MapColors;
  readonly xray: MapColors;
  readonly xrayRgb: XrayColors;
}

const rgba = (c: Rgb, alpha: number): string => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${alpha})`;

/**
 * La démo façon Doom : un petit niveau parcouru à la première personne, dessiné comme dans Doom
 * (arbre BSP, murs en colonnes, visplanes, sprites), à côté de sa carte vue de dessus, puis les
 * étapes du rendu expliquées une à une.
 *
 * Sur la vraie page, le visiteur se déplace et l'état de la démo part avec la présence de la fenêtre.
 * Dans une loupe, la copie (`decorative`) reçoit cet état à chaque image (`sync`) et redessine la
 * même image aux rayons X : l'ordre de dessin de chaque morceau, l'arbre sur la carte, et les noms
 * du code de Doom à la place des textes en clair.
 */
@Component({
  selector: 'app-doom-page',
  imports: [RouterLink, DoomControls, DoomSteps],
  templateUrl: './doom-page.html',
  styleUrl: './doom-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.xray]': "mode() === 'xray'",
    '[class.remote]': 'decorative()',
    '[attr.inert]': "decorative() ? '' : null",
    '[attr.aria-hidden]': "decorative() ? 'true' : null",
  },
})
export class DoomPage {
  /** « xray » : la copie d'une loupe, ou toute la page après le code Konami. */
  readonly mode = input<'surface' | 'xray'>('surface');
  /** Copie dans une loupe : ni interactions, ni état propre. */
  readonly decorative = input(false);

  private readonly session = inject(DoomSession);
  private readonly motion = inject(MotionPreference);
  private readonly theme = inject(ThemeStore);
  private readonly frames = inject(FrameLoop);
  private readonly achievements = inject(AchievementsStore);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
  protected readonly year = inject(TODAY).getFullYear();
  protected readonly projectPath = projectLink(DOOM_PROJECT);

  private readonly engine = new DoomEngine();
  private readonly player = new Player(this.engine.level, this.engine.obstacles);
  private readonly doors = new Doors(this.engine.level);
  protected readonly stats = this.engine.level.stats;

  protected readonly room = signal(this.player.sector.room);
  protected readonly facing = signal(heading(this.player.angle));
  protected readonly position = signal(this.positionOf(this.player.x, this.player.y));
  protected readonly counts = signal<FrameCounts>(NO_COUNTS, { equal: sameCounts });
  protected readonly replay = signal<ReplayState>('live');
  protected readonly progress = signal(0);
  protected readonly phase = signal<ReplayPhase | null>(null);
  protected readonly bsp = signal(false);
  /** Algorithme du peintre, pour comparer avec la méthode de Doom. */
  protected readonly painter = signal(false);
  /** Champ de vision, en degrés : 90 dans Doom. */
  protected readonly fov = signal(DEFAULT_FOV);
  protected readonly notice = signal<string | null>(null);

  protected readonly viewLabel = computed(
    () => `Vue du joueur : ${this.room()}, regard vers ${this.facing()}. Flèches ou ZQSD pour se déplacer, Maj pour courir.`,
  );
  protected readonly mapLabel = computed(() => `Carte du niveau vue de dessus : ${this.room()}, position ${this.position()}.`);

  private readonly screen = viewChild.required<ElementRef<HTMLCanvasElement>>('screen');
  private readonly mapCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('map');
  private readonly mapBox = viewChild.required<ElementRef<HTMLElement>>('mapBox');

  private readonly ready = signal(false);
  private screenCtx: CanvasRenderingContext2D | null = null;
  private mapCtx: CanvasRenderingContext2D | null = null;
  private image: ImageData | null = null;
  private pixels: Uint32Array | null = null;
  private colors: Colors | null = null;
  private mapRatio = 1;
  /** Grossissement de la copie dans la loupe, pour garder une carte nette. */
  private scale = 1;
  private readonly keys = new Set<string>();
  private readonly held = new Set<PadAction>();
  private nudge: { action: PadAction; tics: number } | null = null;
  private drag: { id: number; x: number } | null = null;
  /** Temps accumulé, découpé en tics de 1/35 s. */
  private clock = 0;
  private tic = 0;
  /** Horloge des effets figée pendant le ralenti, pour que l'image ne change pas en cours de route. */
  private frozenTic = 0;
  private done = 0;
  private total = 0;
  private dirty = true;
  private lastView: View | null = null;
  private remote: DoomPresence | null = null;
  private readonly visited = new Set<string>();
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.noticeTimer);
      if (!this.decorative()) this.session.publish(null);
    });
    effect(() => {
      this.theme.theme();
      if (this.ready()) this.applyTheme();
    });
    effect(() => {
      this.mode();
      this.dirty = true;
    });
    afterNextRender(() => this.mount());
  }

  /**
   * Copie de loupe : redessine l'image du portfolio, dans la même image que la page (appelé par la
   * loupe à chaque image, juste après avoir placé la copie).
   */
  sync(state: DoomPresence | null, scale: number): void {
    if (!state) return;
    if (Math.abs(scale - this.scale) > 0.05) {
      this.scale = scale;
      this.resizeMap();
    }
    if (!this.dirty && sameDoom(state, this.remote)) return;
    this.remote = state;
    this.dirty = false;
    this.bsp.set(state.bsp);
    this.painter.set(state.painter);
    this.fov.set(state.fov);
    this.replay.set(state.replay ? (state.replay.playing ? 'playing' : 'paused') : 'live');
    this.done = state.replay?.done ?? 0;
    this.total = state.replay?.total ?? 0;
    this.draw({ x: state.x, y: state.y, z: state.z, angle: state.angle, tic: state.tic, fov: state.fov, doors: state.doors, painter: state.painter }, state.replay ? state.replay.done : Infinity);
  }

  // ---------------------------------------------------------------------------------------------
  // Commandes
  // ---------------------------------------------------------------------------------------------

  protected onKey(event: KeyboardEvent, down: boolean): void {
    if (this.decorative() || event.altKey || event.ctrlKey || event.metaKey) return;
    if (USE_KEYS.has(event.code)) {
      event.preventDefault();
      if (down && !event.repeat) this.useDoor();
      return;
    }
    if (!MOVE_KEYS.has(event.code)) return;
    event.preventDefault();
    if (down) this.keys.add(event.code);
    else this.keys.delete(event.code);
  }

  protected releaseKeys(): void {
    this.keys.clear();
    this.held.clear();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.decorative() || event.button !== 0) return;
    const target = event.currentTarget as HTMLElement;
    target.focus();
    target.setPointerCapture?.(event.pointerId);
    this.drag = { id: event.pointerId, x: event.clientX };
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    const dx = event.clientX - this.drag.x;
    this.drag.x = event.clientX;
    if (!dx) return;
    this.player.turnBy(-dx * DRAG_TURN);
    this.moved();
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.drag?.id === event.pointerId) this.drag = null;
  }

  /** Un clic sur la carte : le joueur s'y pose, s'il y a la place. */
  protected onMapClick(event: MouseEvent): void {
    if (this.decorative()) return;
    const canvas = this.mapCanvas().nativeElement;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = ((event.clientX - rect.left) * canvas.width) / rect.width;
    const py = ((event.clientY - rect.top) * canvas.height) / rect.height;
    const { x, y } = mapToWorld(mapFrame(this.engine.level, canvas.width, canvas.height), px, py);
    if (this.player.teleport(x, y)) this.moved();
    else this.say('Pas de place ici : c’est un mur, un pilier ou le vide.');
  }

  /** La touche « utiliser » : la porte devant le joueur s'ouvre, ou se referme. */
  protected useDoor(): void {
    if (this.decorative()) return;
    if (!this.doors.use(this.player.x, this.player.y, this.player.angle)) {
      this.say('Aucune porte à portée : placez-vous juste devant.');
      return;
    }
    if (this.replay() !== 'live') this.stopReplay();
  }

  protected hold(action: PadAction, down: boolean): void {
    if (down) this.held.add(action);
    else this.held.delete(action);
  }

  protected step(action: PadAction): void {
    this.nudge = { action, tics: NUDGE_TICS };
  }

  protected toggleReplay(): void {
    const state = this.replay();
    if (state === 'playing') this.replay.set('paused');
    else if (state === 'paused' && this.done < this.total) this.replay.set('playing');
    else {
      this.beginReplay();
      this.replay.set('playing');
    }
    this.dirty = true;
  }

  protected scrub(fraction: number): void {
    if (this.replay() === 'live') this.beginReplay();
    this.done = Math.round(Math.max(0, Math.min(1, fraction)) * this.total);
    this.replay.set('paused');
    this.dirty = true;
  }

  protected stopReplay(): void {
    this.replay.set('live');
    this.done = 0;
    this.dirty = true;
  }

  /** Un autre champ de vision change toute l'image : le ralenti en cours n'a plus de sens. */
  protected setFov(fov: number): void {
    const next = Math.max(MIN_FOV, Math.min(MAX_FOV, Math.round(fov)));
    if (next === this.fov()) return;
    this.fov.set(next);
    if (this.replay() !== 'live') this.stopReplay();
    this.dirty = true;
  }

  /** L'autre méthode de dessin donne une autre image à rejouer : on repart du direct. */
  protected togglePainter(): void {
    this.painter.update((on) => !on);
    if (this.replay() !== 'live') this.stopReplay();
    this.dirty = true;
  }

  protected toggleBsp(): void {
    this.bsp.update((on) => !on);
    this.dirty = true;
  }

  // ---------------------------------------------------------------------------------------------
  // Boucle et dessin
  // ---------------------------------------------------------------------------------------------

  private mount(): void {
    const canvas = this.screen().nativeElement;
    this.screenCtx = canvas.getContext('2d');
    if (this.screenCtx) {
      this.image = this.screenCtx.createImageData(SCREEN_W, SCREEN_H);
      this.pixels = new Uint32Array(this.image.data.buffer);
    }
    this.mapCtx = this.mapCanvas().nativeElement.getContext('2d');
    this.applyTheme();
    observeResize([this.mapBox().nativeElement], () => this.resizeMap(), this.destroyRef);
    this.ready.set(true);
    if (this.decorative()) return;
    this.noteRoom();
    const stop = this.frames.add((_now, dt) => this.frame(dt));
    this.destroyRef.onDestroy(stop);
  }

  /** Une image du navigateur : les tics écoulés, le ralenti, puis le dessin si quelque chose a changé. */
  private frame(dt: number): void {
    this.clock = Math.min(this.clock + dt, TIC_MS * 4);
    let moved = false;
    let ticked = false;
    let ticks = 0;
    while (this.clock >= TIC_MS) {
      this.clock -= TIC_MS;
      this.tic++;
      ticked = true;
      ticks++;
      if (this.player.tic(this.input())) moved = true;
      if (this.nudge && --this.nudge.tics <= 0) this.nudge = null;
    }
    if (moved) this.moved();
    if (ticked && this.replay() === 'live') this.tickDoors(ticks);
    if (this.replay() === 'playing') {
      this.done = Math.min(this.total, this.done + (this.total / REPLAY_MS) * dt);
      this.dirty = true;
      if (this.done >= this.total) {
        this.replay.set('paused');
        this.achievements.unlock('image-par-image');
      }
    }
    // En direct, les effets (lumière qui vacille, eau, flammes) avancent à chaque tic.
    const animated = ticked && this.replay() === 'live' && !this.motion.reduced();
    if (this.dirty || animated) {
      this.dirty = false;
      this.draw(this.liveView(), this.replay() === 'live' ? Infinity : Math.floor(this.done));
    }
    this.session.publish(this.presence());
  }

  /** Le joueur a bougé : le ralenti s'arrête, la pièce est notée. */
  private moved(): void {
    if (this.replay() !== 'live') this.replay.set('live');
    this.dirty = true;
    this.noteRoom();
  }

  /** Les portes avancent en direct seulement : le ralenti rejoue une image figée. */
  private tickDoors(ticks: number): void {
    for (let i = 0; i < ticks; i++) if (this.doors.tic(this.player.x, this.player.y)) this.dirty = true;
  }

  private input(): PlayerInput {
    const k = this.keys;
    const on = (action: PadAction) => this.held.has(action) || this.nudge?.action === action;
    const pair = (plus: boolean, minus: boolean) => (plus ? 1 : 0) - (minus ? 1 : 0);
    return {
      forward: pair(k.has('KeyW') || k.has('ArrowUp') || on('avancer'), k.has('KeyS') || k.has('ArrowDown') || on('reculer')),
      turn: pair(k.has('ArrowLeft') || on('gauche'), k.has('ArrowRight') || on('droite')),
      strafe: pair(k.has('KeyD') || on('pas-droite'), k.has('KeyA') || on('pas-gauche')),
      run: k.has('ShiftLeft') || k.has('ShiftRight'),
    };
  }

  private effectsTic(): number {
    if (this.motion.reduced()) return 0;
    return this.replay() === 'live' ? this.tic : this.frozenTic;
  }

  private liveView(): View {
    return { x: this.player.x, y: this.player.y, z: this.player.eyeZ, angle: this.player.angle, tic: this.effectsTic(), fov: this.fov(), doors: this.doors.heights, painter: this.painter() };
  }

  /** Mesure l'image entière avant de la rejouer depuis zéro. */
  private beginReplay(): void {
    this.frozenTic = this.motion.reduced() ? 0 : this.tic;
    this.total = this.engine.render({ ...this.liveView(), tic: this.frozenTic }).stats.ops;
    this.done = 0;
  }

  private draw(view: View, budget: number): void {
    const xray = this.mode() === 'xray';
    const result = this.engine.render(view, budget, true, xray);
    this.lastView = view;
    if (this.screenCtx && this.image && this.pixels && this.colors) {
      this.engine.paint(this.pixels, xray ? this.colors.xrayRgb : null);
      this.screenCtx.putImageData(this.image, 0, 0);
    }
    this.paintMap(view, result, budget, xray);
    this.room.set(subsectorAt(this.engine.level, view.x, view.y).sector.room);
    this.facing.set(heading(view.angle));
    this.position.set(this.positionOf(view.x, view.y));
    this.counts.set(countsOf(result.stats));
    const replaying = budget !== Infinity;
    this.progress.set(replaying && this.total ? Math.min(1, budget / this.total) : 0);
    this.phase.set(!replaying ? null : view.painter && budget < result.stats.ops ? 'peintre' : phaseOf(result.stats, budget));
  }

  private paintMap(view: View, result: FrameResult, budget: number, xray: boolean): void {
    const ctx = this.mapCtx;
    const canvas = this.mapCanvas().nativeElement;
    if (!ctx || !this.colors || !canvas.width || !canvas.height) return;
    drawMap(ctx, canvas.width, canvas.height, this.mapRatio, {
      level: this.engine.level,
      x: view.x,
      y: view.y,
      angle: view.angle,
      fov: view.fov ?? DEFAULT_FOV,
      colors: xray ? this.colors.xray : this.colors.surface,
      bsp: this.bsp() || xray,
      numbers: xray,
      hidden: xray,
      trace: budget !== Infinity || xray ? result.trace : null,
      budget,
      wallOps: result.stats.wallOps,
    });
  }

  private resizeMap(): void {
    const win = this.doc.defaultView;
    const box = this.mapBox().nativeElement;
    const canvas = this.mapCanvas().nativeElement;
    if (!win || !box.clientWidth || !box.clientHeight) return;
    this.mapRatio = Math.min(3, Math.max(1, (win.devicePixelRatio || 1) * this.scale));
    const w = Math.round(box.clientWidth * this.mapRatio);
    const h = Math.round(box.clientHeight * this.mapRatio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    this.dirty = true;
  }

  /** L'état à annoncer aux loupes : exactement la vue dessinée. */
  private presence(): DoomPresence {
    const v = this.lastView ?? this.liveView();
    const replay = this.replay();
    return {
      x: v.x,
      y: v.y,
      z: v.z,
      angle: v.angle,
      fov: v.fov ?? DEFAULT_FOV,
      tic: v.tic,
      replay: replay === 'live' ? null : { done: Math.floor(this.done), total: this.total, playing: replay === 'playing' },
      bsp: this.bsp(),
      doors: v.doors ?? this.doors.heights,
      painter: !!v.painter,
    };
  }

  private noteRoom(): void {
    this.visited.add(this.player.sector.room);
    if (this.visited.size === this.engine.level.rooms.length) this.achievements.unlock('cartographe');
  }

  private say(text: string): void {
    this.notice.set(text);
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.notice.set(null), 2600);
  }

  private positionOf(x: number, y: number): string {
    return `${Math.round(x)} · ${Math.round(y)}`;
  }

  /** Les couleurs du thème actif, lues dans les variables CSS : la palette du jeu et celles de la carte. */
  private applyTheme(): void {
    const styles = this.doc.defaultView?.getComputedStyle(this.doc.documentElement);
    const read = (name: string, fallback: string): Rgb => parseColor(styles?.getPropertyValue(name) ?? '', fallback);
    const ramps = RAMP_COLORS.map(([name, fallback]) => read(name, fallback));
    const paper2 = read('--paper-2', '#eef2ff');
    const ink = read('--ink', '#111827');
    const muted = read('--muted', '#4b5563');
    const accent = read('--accent', '#4f46e5');
    const accent2 = read('--accent-2', '#9333ea');
    const xbg = read('--xbg', '#06101d');
    const xbg2 = read('--xbg-2', '#0b1726');
    const xl = read('--xl', '#7fe9ff');
    const xn = read('--xn', '#ffd84d');
    const xp = read('--xp', '#ff5bd0');
    const xtext = read('--xtext', '#e3f8ff');
    this.colors = {
      ramps,
      surface: {
        floor: rgba(paper2, 1),
        wall: rgba(ink, 0.9),
        step: rgba(accent, 0.85),
        soft: rgba(muted, 0.5),
        thing: rgba(accent2, 0.85),
        player: rgba(accent, 1),
        fov: rgba(accent, 0.14),
        visit: rgba(accent, 0.16),
        current: rgba(accent2, 0.55),
        bsp: rgba(accent2, 0.9),
        text: rgba(ink, 0.75),
        secret: rgba(accent2, 1),
      },
      xray: {
        floor: rgba(xbg2, 0.7),
        wall: rgba(xl, 0.95),
        step: rgba(xl, 0.6),
        soft: rgba(xl, 0.3),
        thing: rgba(xn, 0.9),
        player: rgba(xn, 1),
        fov: rgba(xn, 0.12),
        visit: rgba(xl, 0.1),
        current: rgba(xp, 0.5),
        bsp: rgba(xp, 0.85),
        text: rgba(xtext, 0.75),
        secret: rgba(xp, 1),
      },
      xrayRgb: { bg: xbg, line: xl, note: xn, pink: xp, text: xtext },
    };
    this.engine.setColors(ramps);
    this.dirty = true;
  }
}
