import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { SecretsStore } from '../core/secrets.store';
import { ThemeStore } from '../core/theme.store';
import { SecretsPanel } from './secrets-panel';

/** Les commandes flottantes : loupes, rayons X, progression et singularité. */
@Component({
  selector: 'app-control-dock',
  imports: [SecretsPanel],
  template: `
    <div class="dock" role="toolbar" aria-label="Loupe et secrets">
      <button
        type="button"
        class="pill counter"
        popovertarget="secrets-panel"
        [attr.aria-label]="'Secrets trouvés : ' + store.count() + ' sur ' + store.total"
      >
        <span class="ring" [style.--p]="store.progress()" aria-hidden="true"></span>
        {{ store.count() }}/{{ store.total }}
      </button>
      <button
        type="button"
        class="pill"
        [attr.aria-label]="'Thème : ' + theme.def().label + '. Changer de thème'"
        (click)="theme.next()"
      >
        <span class="swatch" aria-hidden="true"></span> {{ theme.def().label }}
      </button>
      <button type="button" class="pill" [attr.aria-pressed]="xrayView()" (click)="toggleXray.emit()">
        Rayons X
      </button>
      <button type="button" class="pill" [attr.aria-pressed]="inpageLens()" (click)="toggleInpage.emit()">
        <span aria-hidden="true">◉</span> Loupe intégrée
      </button>
      <button type="button" class="pill primary" (click)="openLens.emit()">
        <span aria-hidden="true">◎</span> Ouvrir la loupe
      </button>
      @if (singularityAvailable()) {
        <button type="button" class="pill singularity" (click)="openSingularity.emit()">
          <span aria-hidden="true">✦</span> Singularité
        </button>
      }
    </div>
    <app-secrets-panel />
  `,
  styleUrl: './control-dock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlDock {
  readonly inpageLens = input(false);
  readonly xrayView = input(false);
  readonly singularityAvailable = input(false);

  readonly openLens = output<void>();
  readonly toggleInpage = output<void>();
  readonly toggleXray = output<void>();
  readonly openSingularity = output<void>();

  protected readonly store = inject(SecretsStore);
  protected readonly theme = inject(ThemeStore);
}
