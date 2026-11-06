import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Seo } from '@core/seo/seo';
import { metaFor, seoTags } from '@domain/profile/seo';
import { AchievementToast } from '@features/achievements/ui/achievement-toast';
import { TerminalOverlay } from '@features/terminal/terminal-overlay';
import { VIEWER_PATH } from '@features/viewer/data/viewer-state';
import { ViewerSession } from '@features/viewer/data/viewer-session';
import { ViewerPage } from '@features/viewer/viewer-page';

import { ControlDock } from './control-dock/control-dock';
import { connectPageWindow } from './page-window';

/**
 * La fenêtre de la démo du visualiseur 3D. Elle s'annonce comme une page projet, avec en plus
 * l'état de la scène : une loupe posée dessus en dessine la même vue, aux rayons X.
 */
@Component({
  selector: 'app-viewer-shell',
  imports: [ViewerPage, ControlDock, AchievementToast, TerminalOverlay],
  template: `
    <app-viewer-page [mode]="page.xrayAll() ? 'xray' : 'surface'" />
    <app-control-dock />
    <app-achievement-toast />
    <app-terminal-overlay (singularity)="page.openSingularity()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerShell {
  private readonly session = inject(ViewerSession);
  protected readonly page = connectPageWindow(
    () => VIEWER_PATH,
    () => ({ viewer: this.session.snapshot() }),
  );

  constructor() {
    inject(Seo).apply(seoTags(metaFor(VIEWER_PATH)));
  }
}
