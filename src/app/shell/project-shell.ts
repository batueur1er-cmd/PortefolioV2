import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';

import { Seo } from '@core/seo/seo';
import { metaFor, seoTags } from '@domain/profile/seo';
import { projectLink } from '@domain/profile/projects';
import { ProjectPage } from '@features/project/project-page';
import { AchievementsStore } from '@features/achievements/data/achievements.store';
import { AchievementToast } from '@features/achievements/ui/achievement-toast';
import { TerminalOverlay } from '@features/terminal/terminal-overlay';

import { ControlDock } from './control-dock/control-dock';
import { connectPageWindow } from './page-window';
import { RoleSwitch } from './role-switch/role-switch';

/**
 * La fenêtre d'une page projet : la page et le bouton mode nuit. Elle annonce, comme l'accueil,
 * sa position et son défilement, avec son adresse : une loupe posée dessus suit le changement de page.
 */
@Component({
  selector: 'app-project-shell',
  imports: [RoleSwitch, ProjectPage, ControlDock, AchievementToast, TerminalOverlay],
  template: `
    <app-role-switch>
      <ng-template>
        <app-project-page [id]="id()" [mode]="page.xrayAll() ? 'xray' : 'surface'" />
        <app-control-dock />
        <app-achievement-toast />
        <app-terminal-overlay (singularity)="page.openSingularity()" />
      </ng-template>
    </app-role-switch>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShell {
  readonly id = input.required<string>();
  protected readonly page = connectPageWindow(() => projectLink(this.id()));

  constructor() {
    const seo = inject(Seo);
    const achievements = inject(AchievementsStore);
    effect(() => achievements.visitProject(this.id()));
    effect(() => {
      const path = projectLink(this.id());
      const meta = metaFor(path);
      // Adresse inconnue : la page dit « Projet introuvable », le titre aussi.
      seo.apply(meta.path === path ? seoTags(meta) : { ...seoTags(meta), title: 'Projet introuvable — Baptiste Nodon' });
    });
  }
}
