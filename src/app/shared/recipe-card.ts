import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { RecipeSummary } from '../core/models/recipe.model';
import { FavoritesService } from '../core/services/favorites.service';

// Tarjeta de receta. Lo que se pase dentro de la etiqueta aparece debajo del título.
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-sm"
    >
      <a
        [routerLink]="['/receta', recipe().id]"
        class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <img
          [src]="thumbUrl()"
          [alt]="'Fotografía de ' + recipe().name"
          loading="lazy"
          decoding="async"
          width="400"
          height="300"
          class="aspect-[4/3] w-full bg-slate-100 object-cover"
        />
        <h3 class="px-4 pt-3 font-semibold leading-snug text-slate-900 group-hover:text-blue-700">
          {{ recipe().name }}
        </h3>
      </a>

      <div class="mt-auto px-4 pt-2 text-sm text-slate-600">
        <ng-content />
      </div>

      <div class="px-4 pb-4 pt-3">
        <button
          type="button"
          class="w-full rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          [class]="
            isFavorite()
              ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
              : 'border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-700'
          "
          [attr.aria-pressed]="isFavorite()"
          [attr.aria-label]="favoriteLabel()"
          (click)="favorites.toggle(recipe())"
        >
          {{ isFavorite() ? 'Guardada' : 'Guardar' }}
        </button>
      </div>
    </article>
  `,
})
export class RecipeCard {
  readonly recipe = input.required<RecipeSummary>();
  protected readonly favorites = inject(FavoritesService);

  protected readonly isFavorite = computed(() =>
    this.favorites.has(this.recipe().id),
  );

  protected readonly favoriteLabel = computed(() => {
    const name = this.recipe().name;
    return this.isFavorite()
      ? `Quitar ${name} de favoritos`
      : `Guardar ${name} en favoritos`;
  });

  // TheMealDB deja pedir miniaturas con /medium; si la URL ya trae tamaño, la dejo igual.
  protected readonly thumbUrl = computed(() => {
    const url = this.recipe().thumb;
    if (!url) return '';
    return /\/\w+$/.test(url) ? url : `${url}/medium`;
  });
}
