import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Un bandeau qui défile sans fin. Le contenu est doublé et glisse de la moitié de sa largeur :
 * la durée ne dépend pas de la longueur du texte, et l'animation est calée sur l'horloge
 * partagée (`--clock`) pour défiler au même endroit dans toutes les fenêtres.
 */
@Component({
  selector: 'app-marquee',
  template: `
    <span class="sr-only">{{ items().join(', ') }}</span>
    <div class="track" aria-hidden="true" [style.animation-duration.s]="duration()">
      @for (copy of [0, 1]; track copy) {
        <ul class="run">
          @for (item of items(); track $index) {
            <li>{{ item }}</li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './marquee.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Marquee {
  readonly items = input.required<readonly string[]>();
  /** Durée d'un tour, en secondes ; doit diviser 120 (voir LOOP_PERIOD). */
  readonly duration = input(60);
}
