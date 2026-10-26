import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Recetario por ingredientes',
    loadComponent: () => import('./features/search/search-page').then((m) => m.SearchPage),
  },
  {
    path: 'receta/:id',
    title: 'Receta · Recetario',
    loadComponent: () =>
      import('./features/recipe-detail/recipe-detail-page').then((m) => m.RecipeDetailPage),
  },
  {
    path: 'favoritos',
    title: 'Favoritos · Recetario',
    loadComponent: () => import('./features/favorites/favorites-page').then((m) => m.FavoritesPage),
  },
  { path: '**', redirectTo: '' },
];
