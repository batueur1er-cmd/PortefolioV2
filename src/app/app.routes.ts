import { Routes } from '@angular/router';

/**
 * L'accueil est la page unique du portfolio : chaque fenêtre y charge le même shell, qui décide
 * lui-même s'il est le portfolio ou une loupe. Chaque projet a ensuite sa propre page.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./shell/window-shell/window-shell').then((m) => m.WindowShell),
  },
  // La démo du visualiseur 3D (VIEWER_PATH) : Three.js n'est chargé qu'ici.
  {
    path: 'projets/visu3d/demo',
    loadComponent: () => import('./shell/viewer-shell').then((m) => m.ViewerShell),
  },
  // La démo façon Doom (DOOM_PATH) : un moteur logiciel, chargé seulement ici.
  {
    path: 'projets/doom/demo',
    loadComponent: () => import('./shell/doom-shell').then((m) => m.DoomShell),
  },
  {
    path: 'projets/:id',
    loadComponent: () => import('./shell/project-shell').then((m) => m.ProjectShell),
  },
  { path: '**', redirectTo: '' },
];
