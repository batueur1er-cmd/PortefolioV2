import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Seo } from '@core/seo/seo';
import { metaFor, seoTags } from '@domain/profile/seo';
import { AchievementToast } from '@features/achievements/ui/achievement-toast';
import { DOOM_PATH } from '@features/doom/data/doom-state';
import { DoomSession } from '@features/doom/data/doom-session';
import { DoomPage } from '@features/doom/doom-page';
import { TerminalOverlay } from '@features/terminal/terminal-overlay';

import { ControlDock } from './control-dock/control-dock';
import { connectPageWindow } from './page-window';

/**
 * La fenêtre de la démo façon Doom. Elle s'annonce comme une page projet, avec en plus la position
 * du joueur et l'état du rendu : une loupe posée dessus redessine la même image, aux rayons X.
 */
@Component({
  selector: 'app-doom-shell',
  imports: [DoomPage, ControlDock, AchievementToast, TerminalOverlay],
  template: `
    <app-doom-page [mode]="page.xrayAll() ? 'xray' : 'surface'" />
    <app-control-dock />
    <app-achievement-toast />
    <app-terminal-overlay (singularity)="page.openSingularity()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoomShell {
  private readonly session = inject(DoomSession);
  protected readonly page = connectPageWindow(
    () => DOOM_PATH,
    () => ({ doom: this.session.snapshot() }),
  );

  constructor() {
    inject(Seo).apply(seoTags(metaFor(DOOM_PATH)));
  }
}
