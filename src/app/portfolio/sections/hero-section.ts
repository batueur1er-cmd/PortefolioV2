import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { observeResize, whenFontsReady } from '../../core/dom';
import { PROFILE } from '../../core/profile.data';
import { PageContext } from '../page-context';
import { SecretDirective } from '../secret.directive';

@Component({
  selector: 'app-hero-section',
  imports: [SecretDirective],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  protected readonly page = inject(PageContext);
  protected readonly profile = PROFILE;
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
