import { DOCUMENT, DestroyRef, Signal, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { FrameLoop } from '@core/dom/frame-loop';
import { contentOrigin, pageZoom } from '@core/geometry/geometry';
import { MainPresence, WindowBus } from '@core/sync/window-bus';
import { WindowRoleStore } from '@features/lens/data/window-role.store';
import { measureProjectsOverlay } from '@features/page/projects/projects-dialog/projects-dialog';

export interface PageWindow {
  /** Toute la page en rayons X, sur ordre d'une loupe (code Konami). */
  readonly xrayAll: Signal<boolean>;
  /** La singularité vit sur l'accueil : on y retourne, en lui demandant de l'ouvrir. */
  readonly openSingularity: () => void;
}

/**
 * Branche une page secondaire (page projet, démo) sur les autres fenêtres. La fenêtre est un
 * portfolio : à chaque image, elle annonce sa position, son défilement et son adresse (une loupe
 * posée dessus suit le changement de page), avec ce que la page y ajoute (`extra`). Elle défile sur
 * ordre d'une loupe et passe en rayons X sur ordre du code Konami. À appeler dans un constructeur.
 */
export function connectPageWindow(
  route: () => string,
  extra: () => Pick<MainPresence, 'viewer' | 'doom'> = () => ({}),
): PageWindow {
  const bus = inject(WindowBus);
  const roles = inject(WindowRoleStore);
  const frames = inject(FrameLoop);
  const doc = inject(DOCUMENT);
  const router = inject(Router);
  const destroyRef = inject(DestroyRef);
  const xrayAll = signal(false);
  bus.role.set('main');

  // La molette d'une loupe posée dessus fait défiler cette page.
  bus.commands$.pipe(takeUntilDestroyed()).subscribe((command) => {
    if (command.type === 'scroll' && command.target === bus.id) {
      doc.defaultView?.scrollBy({ top: command.dy, behavior: 'instant' });
    } else if (command.type === 'xray-all') {
      xrayAll.set(command.on);
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
        route: route(),
        overlay: measureProjectsOverlay(doc),
        ...extra(),
      });
    });
    destroyRef.onDestroy(stop);
  });

  return {
    xrayAll: xrayAll.asReadonly(),
    openSingularity: () => void router.navigate(['/'], { state: { singularity: true } }),
  };
}
