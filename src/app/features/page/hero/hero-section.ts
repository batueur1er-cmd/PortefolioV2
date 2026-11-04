import { RouterLink } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { observeResize, whenFontsReady } from '@core/dom/dom';
import { Clock, formatClock } from '@core/time/clock';
import { PROFILE } from '@domain/profile/profile.data';
import { SecretDirective } from '@features/secrets/secret.directive';
import { MagneticDirective } from '@shared/motion/magnetic.directive';
import { SplitText } from '@shared/motion/split-text';
import { Marquee } from '@shared/ui/marquee';
import { WindowGesture } from '@shared/ui/window-gesture';

import { PageContext } from '../page-context';
import { HeroOrb } from './hero-orb';

@Component({
  selector: 'app-hero-section',
  imports: [SecretDirective, SplitText, Marquee, MagneticDirective, HeroOrb, WindowGesture, RouterLink],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  protected readonly page = inject(PageContext);
  private readonly clock = inject(Clock);
  protected readonly profile = PROFILE;
  protected readonly skills = PROFILE.skills.map((s) => s.label);
  protected readonly time = computed(() => formatClock(this.clock.now()));
  /** Taille réelle du titre, mesurée en direct : elle varie avec la largeur de la page. */
  protected readonly fontSize = signal('…');
  private readonly name = viewChild.required<ElementRef<HTMLElement>>('name');

  constructor() {
    const destroyRef = inject(DestroyRef);
    const doc = inject(DOCUMENT);
    afterNextRender(() => {
      const element = this.name().nativeElement;
      const measure = () => {
        const size = parseFloat(doc.defaultView?.getComputedStyle(element).fontSize ?? '');
        this.fontSize.set(Number.isFinite(size) ? `${Math.round(size)} px` : '…');
      };
      observeResize([element], measure, destroyRef);
      whenFontsReady(doc, measure);
    });
  }
}
