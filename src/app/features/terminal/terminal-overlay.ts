import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { MotionPreference } from '@core/dom/motion-preference';
import { ThemeStore } from '@core/theme/theme.store';
import { TODAY } from '@core/time/time';
import { isCvFocus } from '@domain/profile/cv';
import { PROFILE } from '@domain/profile/profile.data';
import { AchievementsStore } from '@features/achievements/data/achievements.store';
import { CvDownload } from '@features/cv/cv-download';
import { SecretsStore } from '@features/secrets/data/secrets.store';
import { HuntClock, formatElapsed } from '@features/secrets/data/hunt-clock';

import { TermLine, TerminalContext, complete, runCommand } from './data/terminal-commands';

/** Touches qui ouvrent le terminal : « ~ » (QWERTY), « ² » et « ` » (la touche sous Échap en AZERTY). */
const OPEN_KEYS = new Set(['~', '²', '`']);

/**
 * Un terminal caché, ouvert avec la touche « ~ » (ou « ² ») : whoami, projets, contact, cv…
 * Il se pose par-dessus la page sans rien déplacer.
 */
@Component({
  selector: 'app-terminal-overlay',
  templateUrl: './terminal-overlay.html',
  styleUrl: './terminal-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class TerminalOverlay {
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeStore);
  private readonly motion = inject(MotionPreference);
  private readonly secrets = inject(SecretsStore);
  private readonly hunt = inject(HuntClock);
  private readonly achievements = inject(AchievementsStore);
  private readonly cv = inject(CvDownload);
  private readonly today = inject(TODAY);

  /** La commande « singularite » : à la fenêtre qui accueille le terminal de l'ouvrir. */
  readonly singularity = output<void>();

  protected readonly open = signal(false);
  protected readonly lines = signal<readonly TermLine[]>([]);
  protected readonly value = signal('');
  protected readonly prompt = 'visiteur@baptiste:~$';

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('field');
  private readonly screen = viewChild<ElementRef<HTMLElement>>('screen');
  private readonly history: string[] = [];
  private cursor = 0;
  private opener: Element | null = null;

  constructor() {
    // Le champ prend le focus à l'ouverture, et l'écran suit la dernière ligne.
    afterRenderEffect(() => {
      this.lines();
      if (!this.open()) return;
      this.input()?.nativeElement.focus({ preventScroll: true });
      const screen = this.screen()?.nativeElement;
      if (screen) screen.scrollTop = screen.scrollHeight;
    });
  }

  protected onKey(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.open()) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
      return;
    }
    if (!OPEN_KEYS.has(e.key) || e.ctrlKey || e.metaKey) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    this.show();
  }

  protected onFieldKey(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.submit();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.history.length) return;
      this.cursor = Math.max(0, Math.min(this.history.length, this.cursor + (e.key === 'ArrowUp' ? -1 : 1)));
      this.value.set(this.history[this.cursor] ?? '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.value.set(complete(this.value()));
    } else if (OPEN_KEYS.has(e.key) && !this.value()) {
      // La touche d'ouverture, champ vide : elle referme.
      e.preventDefault();
      this.close();
    }
  }

  protected close(): void {
    this.open.set(false);
    (this.opener as HTMLElement | null)?.focus?.({ preventScroll: true });
  }

  private show(): void {
    this.opener = this.doc.activeElement;
    this.open.set(true);
    this.achievements.unlock('terminal');
    if (!this.lines().length) {
      this.lines.set([
        { text: `Terminal du portfolio de ${PROFILE.firstName} ${PROFILE.lastName}.`, kind: 'ok' },
        { text: 'Tapez « aide » pour la liste des commandes, Échap pour fermer.', kind: 'dim' },
      ]);
    }
  }

  private submit(): void {
    const input = this.value().trim();
    this.value.set('');
    if (!input) return;
    this.history.push(input);
    this.cursor = this.history.length;
    const before: TermLine = { text: `${this.prompt} ${input}`, kind: 'cmd' };
    this.lines.update((lines) => [...lines, before]);
    const output = runCommand(input, this.context());
    this.lines.update((lines) => [...lines, ...output]);
  }

  private context(): TerminalContext {
    const unlocked = this.achievements.unlocked();
    return {
      profile: PROFILE,
      today: this.today,
      secrets: {
        found: this.secrets.count(),
        total: this.secrets.total,
        elapsed: this.hunt.elapsed() ? formatElapsed(this.hunt.elapsed()) : '',
        best: this.hunt.best() ? formatElapsed(this.hunt.best() ?? 0) : '',
        hint: () => this.hunt.hint(),
      },
      achievements: this.achievements.catalog.map((a) => ({ label: a.label, hint: a.hint, unlocked: unlocked.has(a.id) })),
      navigate: (path, fragment) => {
        const here = this.router.url.split('#')[0] || '/';
        const target = fragment && here === path ? this.doc.getElementById(fragment) : null;
        // Déjà sur la bonne page : on défile simplement jusqu'à la section.
        if (target) target.scrollIntoView({ behavior: this.motion.reduced() ? 'auto' : 'smooth' });
        else void this.router.navigate([path], { fragment });
      },
      downloadCv: (focus) => void this.cv.download(isCvFocus(focus) ? focus : null),
      setTheme: (id) => this.theme.set(id),
      toggleSimple: () => {
        this.motion.toggle();
        if (this.motion.simple()) this.achievements.unlock('version-simple');
        return this.motion.simple();
      },
      openSingularity: () => {
        this.close();
        this.singularity.emit();
      },
      forgetSecrets: () => this.secrets.reset(),
      forgetAchievements: () => this.achievements.reset(),
      clear: () => this.lines.set([]),
      close: () => this.close(),
    };
  }
}
