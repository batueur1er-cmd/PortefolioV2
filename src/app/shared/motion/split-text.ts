import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Découpe un texte en lettres ou en mots, chacun dans son élément avec son rang (`--i`), pour des
 * animations échelonnées en CSS. Le texte reste lisible d'un seul tenant par les lecteurs d'écran.
 */
@Component({
  selector: 'app-split-text',
  template: `
    <span class="sr-only">{{ text() }}</span>
    <span class="pieces" aria-hidden="true">
      @for (piece of pieces(); track $index) {
        <!-- Une espace interpolée : Angular supprime les espaces seules du gabarit. -->
        @if (piece === ' ') {
          {{ ' ' }}
        } @else {
          <span class="piece" [style.--i]="$index + offset()">{{ piece }}</span>
        }
      }
    </span>
  `,
  styles: `
    :host {
      display: inline;
    }
    .piece {
      display: inline-block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitText {
  readonly text = input.required<string>();
  readonly by = input<'letter' | 'word'>('letter');
  /** Décalage de rang, pour enchaîner plusieurs textes. */
  readonly offset = input(0);

  protected readonly pieces = computed(() =>
    this.by() === 'letter' ? [...this.text()] : this.text().split(/(\s+)/).map((p) => (/^\s+$/.test(p) ? ' ' : p)),
  );
}
