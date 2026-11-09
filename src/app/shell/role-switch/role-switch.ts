import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, contentChild, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { WindowRole } from '@core/sync/window-bus';
import { WindowRoleStore } from '@features/lens/data/window-role.store';
import { LensView } from '@features/lens/lens-view/lens-view';

interface Morph {
  readonly id: number;
  readonly to: WindowRole;
}

/**
 * Ce que montre une fenêtre, à n'importe quelle adresse du site : sa page (le gabarit donné en
 * contenu) ou la loupe, selon le rôle qu'elle s'est découvert, avec une transition quand ce rôle
 * change en cours de route. Un gabarit, et pas du simple contenu : la page ne doit pas exister
 * pendant que la fenêtre est une loupe.
 */
@Component({
  selector: 'app-role-switch',
  imports: [NgTemplateOutlet, LensView],
  template: `
    @switch (roles.role()) {
      @case ('main') {
        <ng-container [ngTemplateOutlet]="page()" />
      }
      @case ('lens') {
        @defer (on immediate) {
          <app-lens-view />
        }
      }
      @default {
        <p class="boot">Révélateur<span>· à l'écoute des autres fenêtres</span></p>
      }
    }

    @if (morph(); as m) {
      @for (key of [m.id]; track key) {
        <div class="morph" [class]="'morph to-' + m.to" aria-hidden="true" (animationend)="morph.set(null)">
          <span>{{ m.to === 'lens' ? 'Mode loupe' : 'Mode portfolio' }}</span>
        </div>
      }
    }
    <p class="sr-only" aria-live="polite">{{ announcement() }}</p>
  `,
  styleUrl: './role-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSwitch {
  protected readonly roles = inject(WindowRoleStore);
  protected readonly page = contentChild.required(TemplateRef);
  protected readonly morph = signal<Morph | null>(null);
  protected readonly announcement = signal('');

  constructor() {
    const title = inject(Title);
    let pageTitle: string | null = null;
    let previous: WindowRole | null = null;
    let id = 0;
    effect(() => {
      const role = this.roles.role();
      // Le titre de la page revient quand la fenêtre redevient un portfolio.
      if (role === 'lens' && pageTitle === null) {
        pageTitle = title.getTitle();
        title.setTitle('Loupe — Baptiste Nodon');
      } else if (role === 'main' && pageTitle !== null) {
        title.setTitle(pageTitle);
        pageTitle = null;
      }
      if (role && previous && role !== previous) {
        this.morph.set({ id: ++id, to: role });
        this.announcement.set(
          role === 'lens'
            ? 'Cette fenêtre est devenue une loupe. Posez-la sur le portfolio.'
            : 'Cette fenêtre est redevenue le portfolio.',
        );
      }
      previous = role;
    });
  }
}
