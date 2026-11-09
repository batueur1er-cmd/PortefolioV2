import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Seo } from '@core/seo/seo';
import { metaFor, seoTags } from '@domain/profile/seo';
import { AchievementToast } from '@features/achievements/ui/achievement-toast';
import { MAKING_OF_PATH } from '@features/making-of/chapters';
import { MakingOfPage } from '@features/making-of/making-of-page';
import { TerminalOverlay } from '@features/terminal/terminal-overlay';

import { ControlDock } from './control-dock/control-dock';
import { connectPageWindow } from './page-window';

/** La fenêtre du colophon : elle s'annonce comme une page secondaire, qu'une loupe posée dessus rend lisible. */
@Component({
  selector: 'app-making-of-shell',
  imports: [MakingOfPage, ControlDock, AchievementToast, TerminalOverlay],
  template: `
    <app-making-of-page [mode]="page.xrayAll() ? 'xray' : 'surface'" />
    <app-control-dock />
    <app-achievement-toast />
    <app-terminal-overlay (singularity)="page.openSingularity()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MakingOfShell {
  protected readonly page = connectPageWindow(() => MAKING_OF_PATH);

  constructor() {
    inject(Seo).apply(seoTags(metaFor(MAKING_OF_PATH)));
  }
}
