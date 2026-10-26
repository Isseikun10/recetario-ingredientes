import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { IngredientCalories } from '../core/models/recipe.model';

const MAX_BARS = 10;
const MIN_BAR_PERCENT = 3;

interface Bar {
  name: string;
  kcal: number;
  /** Ancho relativo (0–100) respecto al ingrediente con más kcal. */
  percent: number;
  /** Porcentaje del total de la receta que aporta este ingrediente. */
  share: number;
}

/**
 * "Mi toque": gráfica de barras de calorías por ingrediente, hecha solo con
 * HTML y Tailwind (sin librerías de gráficas). Cada barra tiene su valor en
 * texto, así que no depende del color.
 */
@Component({
  selector: 'app-calorie-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <figcaption class="mb-3 text-sm font-medium text-stone-700">
        Calorías por ingrediente (estimado, receta completa)
      </figcaption>

      @if (bars().length === 0) {
        <p class="text-sm text-stone-500">
          No hay datos suficientes para graficar esta receta.
        </p>
      } @else {
        <ul class="space-y-2" aria-label="Calorías por ingrediente">
          @for (bar of bars(); track bar.name) {
            <li
              class="grid grid-cols-[8rem_1fr_4.5rem] items-center gap-2 text-sm"
            >
              <span class="truncate capitalize" [title]="bar.name">
                {{ bar.name }}
              </span>
              <span
                class="relative h-3 rounded-full bg-stone-100"
                role="meter"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-valuenow]="bar.percent"
                [attr.aria-valuetext]="bar.kcal + ' kilocalorías, ' + bar.share + '% del total'"
                [attr.aria-label]="bar.name"
              >
                <span
                  class="block h-3 rounded-full bg-amber-500"
                  [style.width.%]="bar.percent"
                ></span>
              </span>
              <span class="text-right tabular-nums text-stone-600">
                {{ bar.kcal }} kcal
              </span>
            </li>
          }
        </ul>

        @if (hidden() > 0) {
          <p class="mt-2 text-xs text-stone-500">
            + {{ hidden() }}
            {{ hidden() === 1 ? 'ingrediente' : 'ingredientes' }}
            con aporte menor no se {{ hidden() === 1 ? 'muestra' : 'muestran' }}.
          </p>
        }

        <p class="mt-3 text-xs text-stone-500">
          Total estimado: <span class="font-medium tabular-nums">{{ total() }} kcal</span>
        </p>
      }
    </figure>
  `,
})
export class CalorieChart {
  readonly items = input.required<readonly IngredientCalories[]>();

  /** Ingredientes con kcal > 0, ordenados de mayor a menor aporte. */
  private readonly withKcal = computed(() =>
    this.items()
      .filter(
        (i): i is IngredientCalories & { kcal: number } =>
          i.kcal !== null && i.kcal > 0,
      )
      .sort((a, b) => b.kcal - a.kcal),
  );

  /** Suma de kcal de todos los ingredientes estimados (no solo los visibles). */
  protected readonly total = computed(() =>
    this.withKcal().reduce((sum, i) => sum + i.kcal, 0),
  );

  protected readonly bars = computed<readonly Bar[]>(() => {
    const all = this.withKcal();
    const top = all.slice(0, MAX_BARS);
    const max = top[0]?.kcal ?? 1;
    const total = this.total() || 1;

    return top.map((i) => ({
      name: i.name,
      kcal: i.kcal,
      percent: Math.max(MIN_BAR_PERCENT, (i.kcal / max) * 100),
      share: Math.round((i.kcal / total) * 100),
    }));
  });

  protected readonly hidden = computed(() =>
    Math.max(0, this.withKcal().length - MAX_BARS),
  );
}