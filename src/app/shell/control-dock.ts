import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { ThemeStore } from '@core/theme/theme.store';
import { SecretsStore } from '@features/secrets/data/secrets.store';
import { SecretsPanel } from '@features/secrets/ui/secrets-panel';

/**
 * Les commandes flottantes : progression, loupe de poche, rayons X, thème et singularité.
 * La vraie loupe n'a pas de bouton : elle naît d'une seconde fenêtre qu'on rétrécit.
 */
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
        <span class="count">{{ store.count() }}<small>/{{ store.total }}</small></span>
      </button>
      <span class="sep" aria-hidden="true"></span>
      <button type="button" class="pill" [attr.aria-pressed]="pocketLens()" (click)="togglePocket.emit()">
        <span class="glyph" aria-hidden="true">◉</span><span class="text">Loupe de poche</span>
      </button>
      <button type="button" class="pill" [attr.aria-pressed]="xrayView()" (click)="toggleXray.emit()">
        <span class="glyph" aria-hidden="true">▦</span><span class="text">Rayons X</span>
      </button>
      <button
        type="button"
        class="pill"
        [attr.aria-label]="'Thème : ' + theme.def().label + '. Changer de thème'"
        (click)="theme.next()"
      >
        <span class="swatch" aria-hidden="true"></span><span class="text">{{ theme.def().label }}</span>
      </button>
      @if (singularityAvailable()) {
        <button type="button" class="pill singularity" (click)="openSingularity.emit()">
          <span class="glyph" aria-hidden="true">✦</span><span class="text">Singularité</span>
        </button>
      }
    </div>
    <app-secrets-panel />
  `,
  styleUrl: './control-dock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlDock {
  readonly pocketLens = input(false);
  readonly xrayView = input(false);
  readonly singularityAvailable = input(false);

  readonly togglePocket = output<void>();
  readonly toggleXray = output<void>();
  readonly openSingularity = output<void>();

  protected readonly store = inject(SecretsStore);
  protected readonly theme = inject(ThemeStore);
}
