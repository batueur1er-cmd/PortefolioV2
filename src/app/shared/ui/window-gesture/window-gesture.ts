import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Le geste de la loupe, en miniature : une seconde fenêtre rapetisse, glisse sur la première et
 * se met à voir à travers. Purement décoratif ; le texte voisin dit la même chose.
 */
@Component({
  selector: 'app-window-gesture',
  template: `
    <span class="big"><i></i><i></i><i></i></span>
    <span class="small"><span class="grid"></span></span>
  `,
  styleUrl: './window-gesture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class WindowGesture {}
