import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RevealDirective } from '../motion/reveal.directive';
import { SplitText } from '../motion/split-text';

/**
 * L'en-tête d'une section : numéro, nom, titre en grand et chapeau. Le titre monte mot à mot
 * quand la section arrive à l'écran.
 */
@Component({
  selector: 'app-section-header',
  imports: [SplitText],
  hostDirectives: [RevealDirective],
  template: `
    <p class="kicker">
      <span class="index">{{ index() }}</span>
      <span class="rule" aria-hidden="true"></span>
      <span class="name">{{ name() }}</span>
      @if (count() !== null) {
        <span class="count">({{ count() }})</span>
      }
    </p>
    <h2 class="sec-title" [attr.id]="titleId()">
      <app-split-text [text]="title()" by="word" />
    </h2>
    @if (intro()) {
      <p class="intro">{{ intro() }}</p>
    }
    <ng-content />
  `,
  styleUrl: './section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeader {
  readonly index = input.required<string>();
  readonly name = input.required<string>();
  readonly title = input.required<string>();
  readonly intro = input<string | null>(null);
  readonly count = input<number | null>(null);
  /** Identifiant du titre, pour `aria-labelledby` ; null sur les copies de la page. */
  readonly titleId = input<string | null>(null);
}
