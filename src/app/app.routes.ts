import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./pages/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: '',
        redirectTo: 'prompt',
        pathMatch: 'full',
      },
      {
        path: 'prompt',
        loadComponent: () =>
          import('./pages/prompt.page').then((m) => m.PromptPage),
      },
      {
        path: 'data',
        loadComponent: () =>
          import('./pages/data.page').then((m) => m.DataPage),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./pages/events.page').then((m) => m.EventsPage),
      },
    ],
  },
]
