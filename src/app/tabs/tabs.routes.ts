import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'cars',
        loadComponent: () =>
          import('../cars/cars.page').then((m) => m.CarsPage),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('../documents/documents.page').then((m) => m.DocumentsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full',
  },
];
