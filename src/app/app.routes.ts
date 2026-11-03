import { DOCUMENT, inject } from '@angular/core';
import { CanMatchFn, Routes } from '@angular/router';

/** La loupe est la même application, ouverte avec `?loupe` : aucune réécriture d'URL côté serveur. */
const isLensWindow: CanMatchFn = () => new URLSearchParams(inject(DOCUMENT).location.search).has('loupe');

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [isLensWindow],
    title: 'Loupe — Baptiste Nodon',
    loadComponent: () => import('./lens/lens-shell').then((m) => m.LensShell),
  },
  {
    path: '',
    pathMatch: 'full',
    title: 'Baptiste Nodon — Portfolio',
    loadComponent: () => import('./main/main-shell').then((m) => m.MainShell),
  },
  { path: '**', redirectTo: '' },
];
