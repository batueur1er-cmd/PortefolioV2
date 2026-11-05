import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { MotionPreference } from '@core/dom/motion-preference';
import { ThemeStore } from '@core/theme/theme.store';
import { AchievementsStore } from '@features/achievements/data/achievements.store';

/**
 * Les boutons flottants : version simple et mode nuit. La loupe, elle, n'a pas de bouton : elle
 * naît d'une seconde fenêtre qu'on rétrécit, et c'est au visiteur de le découvrir.
 */
@Component({
  selector: 'app-control-dock',
  template: `
    <button
      type="button"
      class="pill"
      [attr.aria-pressed]="motion.simple()"
      title="Lecture rapide, sans animations"
      (click)="toggleSimple()"
    >
      <span class="icon lines" [class.on]="motion.simple()" aria-hidden="true"></span>
      <span class="text">Version simple</span>
    </button>
    <button type="button" class="pill" [attr.aria-pressed]="night()" (click)="toggle()">
      <span class="icon" [class.moon]="night()" aria-hidden="true"></span>
      <span class="text">Mode nuit</span>
    </button>
  `,
  styleUrl: './control-dock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlDock {
  private readonly theme = inject(ThemeStore);
  protected readonly motion = inject(MotionPreference);
  protected readonly night = computed(() => this.theme.theme() === 'nuit');

  private readonly achievements = inject(AchievementsStore);

  protected toggleSimple(): void {
    this.motion.toggle();
    if (this.motion.simple()) this.achievements.unlock('version-simple');
  }

  protected toggle(): void {
    this.theme.set(this.night() ? 'clair' : 'nuit');
  }
}
