import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CareerMap as CareerMapModel } from '@domain/career/career';

/** La carte du parcours, en plan rayons X : villes, repère et distances. */
@Component({
  selector: 'app-career-map',
  template: `
    <span class="panel-title">Carte du parcours · ≈ {{ map().totalKm }} km</span>
    <svg class="wire map" viewBox="0 0 300 210" aria-hidden="true">
      <rect class="d" x="0.5" y="0.5" width="299" height="209" />
      <line class="d" x1="150" y1="0" x2="150" y2="210" />
      <line class="d" x1="0" y1="105" x2="300" y2="105" />
      <polyline class="hot trail" [attr.points]="map().path" pathLength="100" />
      @for (point of map().points; track point.id) {
        <svg:circle [attr.cx]="point.x" [attr.cy]="point.y" [attr.r]="point.landmark ? 2.5 : 5" [class.d]="point.landmark" />
        <svg:text
          [attr.x]="point.anchor === 'end' ? point.x - 10 : point.x + 10"
          [attr.y]="point.y + point.dy"
          [attr.text-anchor]="point.anchor"
        >
          {{ point.label }}
        </svg:text>
      }
      <text x="268" y="22">N ↑</text>
    </svg>
    <ol class="legs">
      @for (leg of map().legs; track leg.key) {
        <li>{{ leg.label }}</li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      white-space: normal;
    }
    .map {
      display: block;
      width: 100%;
      height: auto;
      margin: 8px 0;
    }
    .trail {
      stroke-dasharray: 3 2;
      animation: march 4s linear infinite;
      animation-delay: var(--clock, 0ms);
    }
    @keyframes march {
      to {
        stroke-dashoffset: -100;
      }
    }
    .legs {
      margin: 0;
      padding-left: 16px;
      font-size: 11px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerMap {
  readonly map = input.required<CareerMapModel>();
}
