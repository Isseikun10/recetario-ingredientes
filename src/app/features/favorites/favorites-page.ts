import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FavoritesService } from '../../core/services/favorites.service';
import { RecipeCard } from '../../shared/recipe-card';

@Component({
  selector: 'app-favorites-page',
  imports: [RouterLink, RecipeCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-3xl font-bold tracking-tight text-slate-900">Mis favoritos</h1>

    @if (favorites.count() === 0) {
      <div
        class="mt-6 rounded-xl border border-slate-200 p-10 text-center text-slate-600"
        role="status"
      >
        <p class="font-medium text-slate-900">Todavía no guardas recetas.</p>
        <p class="mt-1 text-sm">Pulsa «Guardar» en cualquier receta y la verás aquí.</p>
        <a
          routerLink="/"
          class="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Buscar recetas por ingredientes
        </a>
      </div>
    } @else {
      <div class="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-sm text-slate-500">
          {{ favorites.count() }}
          {{ favorites.count() === 1 ? 'receta guardada' : 'recetas guardadas' }}
          en este navegador.
        </p>
        <button
          type="button"
          class="text-sm font-medium text-slate-500 hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          (click)="confirmClear()"
        >
          Vaciar favoritos
        </button>
      </div>

      <ul
        class="mt-5 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3"
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
