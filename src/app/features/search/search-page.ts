import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { MealdbService } from '../../core/services/mealdb.service';
import {
  MAX_INGREDIENTS,
  MIN_INGREDIENTS,
  SearchStateService,
} from '../../core/services/search-state.service';
import { RecipeCard } from '../../shared/recipe-card';

@Component({
  selector: 'app-search-page',
  imports: [RecipeCard],
  templateUrl: './search-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  protected readonly state = inject(SearchStateService);
  private readonly api = inject(MealdbService);

  protected readonly min = MIN_INGREDIENTS;
  protected readonly max = MAX_INGREDIENTS;
  protected readonly inputError = signal<string | null>(null);

  /** Placeholders del skeleton: misma cantidad que resultados máximos. */
  protected readonly skeletons = Array.from({ length: 9 }, (_, i) => i);

  /** Sugerencias para el datalist; si la API falla, el campo sigue funcionando sin ellas. */
  protected readonly suggestions = toSignal(
    this.api.listIngredientNames().pipe(catchError(() => of([] as readonly string[]))),
    { initialValue: [] as readonly string[] },
  );

  /** Faltantes para llegar al mínimo, o 0 si ya se alcanzó. */
  protected readonly missing = computed(() =>
    Math.max(0, MIN_INGREDIENTS - this.state.ingredients().length),
  );

  /** Texto pluralizado de faltantes. */
  protected readonly missingLabel = computed(() => {
    const n = this.missing();
    if (n === 0) return '';
    return n === 1 ? 'Falta 1 ingrediente' : `Faltan ${n} ingredientes`;
  });

  protected add(input: HTMLInputElement): void {
    const error = this.state.add(input.value);
    this.inputError.set(error);
    if (!error) {
      input.value = '';
      // Devolvemos el foco al campo para seguir escribiendo.
      input.focus();
    } else {
      // En error, mantenemos el foco y seleccionamos el texto para corregirlo.
      input.select();
    }
  }
}