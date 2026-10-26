import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { FavoritesService } from '../../core/services/favorites.service';
import { MealdbService } from '../../core/services/mealdb.service';
import { CalorieEstimate } from '../../core/models/recipe.model';
import { estimateRecipe } from '../../core/utils/calorie-estimator';
import { CalorieChart } from '../../shared/calorie-chart';

@Component({
  selector: 'app-recipe-detail-page',
  imports: [RouterLink, CalorieChart],
  templateUrl: './recipe-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailPage {
  /** Llega desde la ruta `receta/:id` gracias a withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly api = inject(MealdbService);
  protected readonly favorites = inject(FavoritesService);

  protected readonly recipe = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.getById(params),
  });

  /**
   * Estimación calórica de la receta cargada.
   * Devuelve `null` mientras carga, si hay error o si la receta no existe.
   */
  protected readonly estimate = computed<CalorieEstimate | null>(() => {
    const recipe = this.recipe.value();
    return recipe ? estimateRecipe(recipe) : null;
  });

  /** Porcentaje entero (0–100) de ingredientes que se pudieron estimar. */
  protected readonly coveragePercent = computed(() =>
    Math.round((this.estimate()?.coverage ?? 0) * 100),
  );

  /** Indica si la receta ya se resolvió (con éxito o error). */
  protected readonly isSettled = computed(
    () => !this.recipe.isLoading() && !this.recipe.error(),
  );

  /** true cuando la receta no existe en TheMealDB (respuesta nula). */
  protected readonly isNotFound = computed(
    () => this.isSettled() && this.recipe.value() === null,
  );

  /** Mensaje de error legible para el estado de fallo. */
  protected readonly errorMessage = computed(() => {
    if (this.isNotFound()) {
      return 'No encontramos esta receta. Puede que se haya eliminado o que el enlace sea incorrecto.';
    }
    if (this.recipe.error()) {
      return 'No pude cargar esta receta. Revisa tu conexión e inténtalo de nuevo.';
    }
    return null;
  });
}