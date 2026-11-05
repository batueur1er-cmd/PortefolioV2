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
  {
    path: 'projets/:id',
    loadComponent: () => import('./shell/project-shell').then((m) => m.ProjectShell),
  },
  { path: '**', redirectTo: '' },
];
