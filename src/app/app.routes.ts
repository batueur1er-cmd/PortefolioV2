import { Routes } from '@angular/router';

/**
 * Une seule page : chaque fenêtre charge le même shell, qui décide lui-même s'il est le portfolio
 * ou une loupe. Aucune réécriture d'URL côté serveur.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./shell/window-shell').then((m) => m.WindowShell),
  },
  { path: '**', redirectTo: '' },
];
