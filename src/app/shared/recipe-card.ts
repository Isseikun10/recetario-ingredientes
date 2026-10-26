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

/**
 * Tarjeta de receta: imagen, nombre, botón de favorito y un slot para
 * información extra.
 */
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group relative flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <a
        [routerLink]="['/receta', recipe().id]"
        class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
      >
        <img
          [src]="thumbUrl()"
          [alt]="'Fotografía de ' + recipe().name"
          loading="lazy"
          decoding="async"
          width="400"
          height="300"
          class="aspect-[4/3] w-full bg-stone-100 object-cover"
        />
        <h3 class="px-3 pt-3 font-semibold leading-snug group-hover:text-amber-700">
          {{ recipe().name }}
        </h3>
      </a>

      <div class="mt-auto px-3 pb-3 pt-2 text-sm text-stone-600">
        <ng-content />
      </div>

      <button
        type="button"
        class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
        [class.text-rose-600]="isFavorite()"
        [class.text-stone-400]="!isFavorite()"
        [attr.aria-pressed]="isFavorite()"
        [attr.aria-label]="favoriteLabel()"
        (click)="favorites.toggle(recipe())"
      >
        <span aria-hidden="true">{{ isFavorite() ? '♥' : '♡' }}</span>
      </button>
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

  /**
   * TheMealDB admite el sufijo `/medium` para miniaturas. Si la URL ya trae
   * un tamaño (p. ej. `/large`), lo respetamos.
   */
  protected readonly thumbUrl = computed(() => {
    const url = this.recipe().thumb;
    if (!url) return '';
    return /\/\w+$/.test(url) ? url : `${url}/medium`;
  });
}