import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Rect } from '@core/geometry/geometry';

/**
 * Là où deux loupes se croisent, les rayons X passent deux fois : on ne voit plus le portfolio,
 * mais sa structure. Le schéma reste centré sur le croisement, dont il ne montre que ce qui tient.
 */
@Component({
  selector: 'app-lens-crossing',
  template: `
    <div class="plan">
      <p class="title">Double exposition · le plan du site</p>
      <div class="layer">
        <b>shell</b>
        <span>la racine de chaque fenêtre</span>
      </div>
      <i class="arrow"></i>
      <div class="layer accent">
        <b>features</b>
        <span>page · secrets · lens · viewer · doom · project · terminal · achievements · cv · singularity</span>
      </div>
      <i class="arrow"></i>
      <div class="pair">
        <div class="layer">
          <b>shared</b>
          <span>briques d’interface</span>
        </div>
        <div class="layer">
          <b>domain</b>
          <span>le profil, en TypeScript pur</span>
        </div>
      </div>
      <i class="arrow"></i>
      <div class="layer">
        <b>core</b>
        <span>géométrie · DOM · bus entre fenêtres · thème · horloge</span>
      </div>
    </div>
  `,
  styleUrl: './lens-crossing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.left.px]': 'rect().x',
    '[style.top.px]': 'rect().y',
    '[style.width.px]': 'rect().w',
    '[style.height.px]': 'rect().h',
  },
})
export class LensCrossing {
  /** Le croisement, en pixels CSS de cette loupe. */
  readonly rect = input.required<Rect>();
}
