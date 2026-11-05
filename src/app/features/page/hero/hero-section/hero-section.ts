import { RouterLink } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { Clock, formatClock } from '@core/time/clock';
import { TODAY } from '@core/time/time';
import { currentPosition } from '@domain/career/career';
import { PROFILE } from '@domain/profile/profile.data';
import { CvDownload } from '@features/cv/cv-download';
import { MagneticDirective } from '@shared/motion/magnetic.directive';
import { SplitText } from '@shared/motion/split-text';
import { Marquee } from '@shared/ui/marquee/marquee';
import { WindowGesture } from '@shared/ui/window-gesture/window-gesture';

import { PageContext } from '../../page-context';
import { HeroOrb } from '../hero-orb/hero-orb';

@Component({
  selector: 'app-hero-section',
  imports: [SplitText, Marquee, MagneticDirective, HeroOrb, WindowGesture, RouterLink],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  protected readonly page = inject(PageContext);
  protected readonly cv = inject(CvDownload);
  private readonly clock = inject(Clock);
  protected readonly profile = PROFILE;
  /** Le poste en cours, pour le bandeau de disponibilité. */
  protected readonly position = currentPosition(PROFILE, inject(TODAY));
  protected readonly skills = PROFILE.skills.map((s) => s.label);
  protected readonly time = computed(() => formatClock(this.clock.now()));
}
