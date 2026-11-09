import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, inject } from '@angular/core';

import { Seo } from '@core/seo/seo';
import { HOME_META, seoTags } from '@domain/profile/seo';
import { WindowRoleStore } from '@features/lens/data/window-role.store';

import { MainView } from '../main-view/main-view';
import { RoleSwitch } from '../role-switch/role-switch';

/** La fenêtre de l'accueil : le portfolio, ou la loupe si la fenêtre a ce rôle. */
@Component({
  selector: 'app-window-shell',
  imports: [MainView, RoleSwitch],
  template: `
    <app-role-switch>
      <ng-template>
        <app-main-view [initialScroll]="lastScroll" />
      </ng-template>
    </app-role-switch>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowShell {
  private readonly roles = inject(WindowRoleStore);
  /** Défilement du portfolio au moment où la fenêtre est devenue loupe, pour y revenir ensuite. */
  protected lastScroll = 0;

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    const onScroll = () => {
      if (this.roles.role() === 'main' && win) this.lastScroll = win.scrollY;
    };
    win?.addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => win?.removeEventListener('scroll', onScroll));
    inject(Seo).apply(seoTags(HOME_META));
  }
}
