import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FavoritesService } from '../../core/services/favorites.service';
import { RecipeCard } from '../../shared/recipe-card';

@Component({
  selector: 'app-favorites-page',
  imports: [RouterLink, RecipeCard],
  template: `
    <h1 class="text-2xl font-bold">Mis favoritos</h1>

    @if (favorites.count() === 0) {
      <div
        class="mt-6 rounded-lg border border-stone-200 bg-white p-6 text-center text-stone-600"
        role="status"
      >
        <p>Aún no guardas recetas.</p>
        <a
          routerLink="/"
          class="mt-2 inline-block font-medium text-amber-700 hover:underline"
        >
          Buscar recetas por ingredientes
        </a>
      </div>
    } @else {
      <div class="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-sm text-stone-500">
          {{ favorites.count() }}
          {{ favorites.count() === 1 ? 'receta guardada' : 'recetas guardadas' }}
          en este navegador.
        </p>
        <button
          type="button"
          class="text-sm font-medium text-stone-500 hover:text-red-700 hover:underline"
          (click)="confirmClear()"
        >
          Vaciar favoritos
        </button>
      </div>

      <ul
        class="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Recetas favoritas"
      >
        @for (item of favorites.items(); track item.id) {
          <li>
            <app-recipe-card [recipe]="item" />
          </li>
        }
      </ul>
    }
  `,
})
export class FavoritesPage {
  protected readonly favorites = inject(FavoritesService);

  protected confirmClear(): void {
    if (confirm('¿Vaciar todos los favoritos? Esta acción no se puede deshacer.')) {
      this.favorites.clear();
    }
  }
}