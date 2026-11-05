import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, afterNextRender, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FrameLoop } from '@core/dom/frame-loop';
import { contentOrigin, pageZoom } from '@core/geometry/geometry';
import { Seo } from '@core/seo/seo';
import { WindowBus } from '@core/sync/window-bus';
import { metaFor, seoTags } from '@domain/profile/seo';
import { projectLink } from '@domain/profile/projects';
import { WindowRoleStore } from '@features/lens/data/window-role.store';
import { ProjectPage } from '@features/project/project-page';
import { AchievementsStore } from '@features/achievements/data/achievements.store';
import { AchievementToast } from '@features/achievements/ui/achievement-toast';
import { TerminalOverlay } from '@features/terminal/terminal-overlay';

import { ControlDock } from './control-dock/control-dock';

/**
 * La fenêtre d'une page projet : la page et le bouton mode nuit. Elle annonce, comme l'accueil,
 * sa position et son défilement, avec son adresse : une loupe posée dessus suit le changement de page.
 */
@Component({
  selector: 'app-project-shell',
  imports: [ProjectPage, ControlDock, AchievementToast, TerminalOverlay],
  template: `
    <app-project-page [id]="id()" [mode]="xrayAll() ? 'xray' : 'surface'" />
    <app-control-dock />
    <app-achievement-toast />
    <app-terminal-overlay />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectShell {
  readonly id = input.required<string>();
  /** Toute la page en rayons X, sur ordre de la loupe (code Konami). */
  protected readonly xrayAll = signal(false);

  constructor() {
    const bus = inject(WindowBus);
    const roles = inject(WindowRoleStore);
    const frames = inject(FrameLoop);
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);
    bus.role.set('main');

    const seo = inject(Seo);
    const achievements = inject(AchievementsStore);
    effect(() => achievements.visitProject(this.id()));
    effect(() => {
      const path = projectLink(this.id());
      const meta = metaFor(path);
      // Adresse inconnue : la page dit « Projet introuvable », le titre aussi.
      seo.apply(meta.path === path ? seoTags(meta) : { ...seoTags(meta), title: 'Projet introuvable — Baptiste Nodon' });
    });

    // La molette d'une loupe posée dessus fait défiler cette page.
    bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
      if (command.type === 'scroll' && command.target === bus.id) {
        doc.defaultView?.scrollBy({ top: command.dy, behavior: 'instant' });
      } else if (command.type === 'xray-all') {
        this.xrayAll.set(command.on);
      }
    });

    afterNextRender(() => {
      const win = doc.defaultView;
      if (!win) return;
      const stop = frames.add(() => {
        const zoom = pageZoom(win);
        bus.windows.publish({
          kind: 'main',
          id: bus.id,
          t: Date.now(),
          origin: contentOrigin(win, zoom),
          pageZoom: zoom,
          viewport: { w: win.innerWidth, h: win.innerHeight },
          small: roles.small(),
          layoutWidth: doc.documentElement.clientWidth,
          scroll: { x: win.scrollX, y: win.scrollY },
          route: `/projets/${this.id()}`,
          overlay: null,
        });
      });
      destroyRef.onDestroy(stop);
    });
  }
}
