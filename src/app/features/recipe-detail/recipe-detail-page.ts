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
import { translateArea, translateCategory } from '../../core/utils/translations';
import { CalorieChart } from '../../shared/calorie-chart';

@Component({
  selector: 'app-recipe-detail-page',
  imports: [RouterLink, CalorieChart],
  templateUrl: './recipe-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailPage {
  // Viene de la ruta receta/:id gracias a withComponentInputBinding()
  readonly id = input.required<string>();

  private readonly api = inject(MealdbService);
  protected readonly favorites = inject(FavoritesService);

  protected readonly recipe = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.getById(params),
  });

  // null mientras carga, si falla o si la receta no existe
  protected readonly estimate = computed<CalorieEstimate | null>(() => {
    const recipe = this.recipe.value();
    return recipe ? estimateRecipe(recipe) : null;
  });

  protected readonly coveragePercent = computed(() =>
    Math.round((this.estimate()?.coverage ?? 0) * 100),
  );

  protected readonly categoryLabel = computed(() => {
    const category = this.recipe.value()?.category;
    return category ? translateCategory(category) : '';
  });

  protected readonly areaLabel = computed(() => {
    const area = this.recipe.value()?.area;
    return area ? translateArea(area) : '';
  });

  protected readonly isSettled = computed(
    () => !this.recipe.isLoading() && !this.recipe.error(),
  );

  // La API respondió bien pero sin receta (id que no existe)
  protected readonly isNotFound = computed(
    () => this.isSettled() && this.recipe.value() === null,
  );

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
