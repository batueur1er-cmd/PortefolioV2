import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ProjectPage } from '@features/project/project-page';

import { ControlDock } from './control-dock';

/** La fenêtre d'une page projet : la page et le bouton mode nuit. Pas de loupe ici. */
@Component({
  selector: 'app-project-shell',
  imports: [ProjectPage, ControlDock],
  template: `
    <app-project-page [id]="id()" />
    <app-control-dock />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShell {
  readonly id = input.required<string>();
}
