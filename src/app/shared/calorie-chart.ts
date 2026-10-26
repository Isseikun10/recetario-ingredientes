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
  percent: number; // ancho respecto al ingrediente que más aporta
  share: number; // % del total de la receta
}

// Gráfica de barras hecha solo con HTML y Tailwind, sin librerías.
// Cada barra lleva su valor en texto para no depender del color.
@Component({
  selector: 'app-calorie-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <figcaption class="mb-3 text-sm font-semibold text-slate-800">
        Calorías por ingrediente
        <span class="font-normal text-slate-500">(estimado, receta completa)</span>
      </figcaption>

      @if (bars().length === 0) {
        <p class="text-sm text-slate-500">
          No hay datos suficientes para graficar esta receta.
        </p>
      } @else {
        <ul class="list-none space-y-2.5 p-0" aria-label="Calorías por ingrediente">
          @for (bar of bars(); track bar.name) {
            <li class="grid grid-cols-[6.5rem_1fr_6.5rem] items-center gap-3 text-sm">
              <span class="truncate capitalize text-slate-700" [title]="bar.name">
                {{ bar.name }}
              </span>
              <span
                class="h-2 overflow-hidden rounded-full bg-slate-100"
                role="meter"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-valuenow]="bar.percent"
                [attr.aria-valuetext]="bar.kcal + ' kilocalorías, ' + bar.share + '% del total'"
                [attr.aria-label]="bar.name"
              >
                <span
                  class="block h-2 rounded-full bg-blue-600"
                  [style.width.%]="bar.percent"
                ></span>
              </span>
              <span class="text-right tabular-nums text-slate-600">
                {{ bar.kcal }} kcal
                <span class="text-xs text-slate-400">{{ bar.share }}%</span>
              </span>
            </li>
          }
        </ul>

        @if (hidden() > 0) {
          <p class="mt-3 text-xs text-slate-500">
            Hay {{ hidden() }}
            {{ hidden() === 1 ? 'ingrediente más' : 'ingredientes más' }}
            con un aporte menor que no {{ hidden() === 1 ? 'se muestra' : 'se muestran' }}.
          </p>
        }

        <p class="mt-3 text-xs text-slate-500">
          Total estimado: <span class="font-semibold tabular-nums text-slate-800">{{ total() }} kcal</span>
        </p>
      }
    </figure>
  `,
})
export class CalorieChart {
  readonly items = input.required<readonly IngredientCalories[]>();

  // Solo los que tienen kcal, de mayor a menor
  private readonly withKcal = computed(() =>
    this.items()
      .filter(
        (i): i is IngredientCalories & { kcal: number } =>
          i.kcal !== null && i.kcal > 0,
      )
      .sort((a, b) => b.kcal - a.kcal),
  );

  // Suma de todos, no solo de los que se ven
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
