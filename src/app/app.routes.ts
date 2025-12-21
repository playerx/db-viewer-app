import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs.page').then((m) => m.TabsPage),
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
        path: 'collections',
        loadComponent: () =>
          import('./pages/collections.page').then((m) => m.CollectionsPage),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./pages/events.page').then((m) => m.EventsPage),
      },
    ],
  },
  {
    path: 'data/:collection',
    loadComponent: () => import('./pages/data.page').then((m) => m.DataPage),
  },
  {
    path: 'document/:collection/:id',
    loadComponent: () =>
      import('./pages/document-detail.page').then((m) => m.DocumentDetailPage),
  },
]
