import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ThemeStore } from '@core/theme/theme.store';

/**
 * Le seul bouton flottant : le mode nuit. La loupe, elle, n'a pas de bouton : elle naît d'une
 * seconde fenêtre qu'on rétrécit, et c'est au visiteur de le découvrir.
 */
@Component({
  selector: 'app-control-dock',
  template: `
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
  protected readonly night = computed(() => this.theme.theme() === 'nuit');

  protected toggle(): void {
    this.theme.set(this.night() ? 'clair' : 'nuit');
  }
}
