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

interface QuickPick {
  label: string; // lo que ve la persona
  value: string; // lo que entiende TheMealDB (inglés)
}

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

  // Atajos en español; por debajo se busca con el nombre en inglés.
  protected readonly quickPicks: readonly QuickPick[] = [
    { label: 'Pollo', value: 'chicken' },
    { label: 'Arroz', value: 'rice' },
    { label: 'Cebolla', value: 'onion' },
    { label: 'Ajo', value: 'garlic' },
    { label: 'Tomate', value: 'tomato' },
    { label: 'Huevo', value: 'egg' },
    { label: 'Papa', value: 'potato' },
    { label: 'Queso', value: 'cheese' },
    { label: 'Pasta', value: 'pasta' },
    { label: 'Limón', value: 'lemon' },
  ];

  private readonly spanishNames = new Map(this.quickPicks.map((p) => [p.value, p.label]));

  // Mismo número de huecos que resultados máximos
  protected readonly skeletons = Array.from({ length: 9 }, (_, i) => i);

  // Si la API falla, el campo sigue funcionando, solo sin sugerencias.
  protected readonly suggestions = toSignal(
    this.api.listIngredientNames().pipe(catchError(() => of([] as readonly string[]))),
    { initialValue: [] as readonly string[] },
  );

  protected readonly chosen = computed(() => new Set(this.state.ingredients()));

  protected readonly missing = computed(() =>
    Math.max(0, MIN_INGREDIENTS - this.state.ingredients().length),
  );

  protected readonly missingLabel = computed(() => {
    const n = this.missing();
    if (n === 0) return '';
    return n === 1
      ? 'Falta 1 ingrediente para poder buscar.'
      : `Faltan ${n} ingredientes para poder buscar.`;
  });

  // "Pollo (chicken)" si lo conocemos, si no el nombre tal cual
  protected displayName(name: string): string {
    const es = this.spanishNames.get(name);
    return es ? `${es} (${name})` : name;
  }

  protected add(input: HTMLInputElement): void {
    const error = this.state.add(input.value);
    this.inputError.set(error);
    if (!error) {
      input.value = '';
      input.focus();
    } else {
      // dejo el texto seleccionado para corregirlo rápido
      input.select();
    }
  }

  // Si ya está elegido lo quito, si no lo agrego
  protected togglePick(pick: QuickPick): void {
    if (this.chosen().has(pick.value)) {
      this.state.remove(pick.value);
      this.inputError.set(null);
      return;
    }
    this.inputError.set(this.state.add(pick.value));
  }
}
