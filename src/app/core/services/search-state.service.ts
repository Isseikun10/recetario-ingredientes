import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, catchError, forkJoin, of, switchMap } from 'rxjs';

import { RankedRecipe, RecipeSummary } from '../models/recipe.model';
import { estimateRecipe } from '../utils/calorie-estimator';
import { MealdbService } from './mealdb.service';

export type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

export const MIN_INGREDIENTS = 2;
export const MAX_INGREDIENTS = 5;
const MAX_RESULTS = 9;

/** Normaliza un nombre de ingrediente tal como lo teclea el usuario. */
function normalizeIngredient(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Estado de la búsqueda compartido entre páginas (rol equivalente a un Context
 * en React): así los resultados siguen ahí al volver desde el detalle de una
 * receta.
 */
@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private readonly api = inject(MealdbService);
  private running?: Subscription;
  /** Contador para descartar respuestas de búsquedas ya superadas. */
  private runId = 0;

  readonly ingredients = signal<readonly string[]>([]);
  readonly searchedWith = signal<readonly string[]>([]);
  readonly status = signal<SearchStatus>('idle');
  readonly results = signal<readonly RankedRecipe[]>([]);

  readonly canSearch = computed(() => {
    const n = this.ingredients().length;
    return n >= MIN_INGREDIENTS && n <= MAX_INGREDIENTS;
  });

  /** true si el usuario ya lanzó al menos una búsqueda con la lista actual. */
  readonly isStale = computed(() => {
    const a = this.ingredients();
    const b = this.searchedWith();
    return a.length !== b.length || a.some((x, i) => x !== b[i]);
  });

  /** Devuelve un mensaje de error de validación, o null si el ingrediente se agregó. */
  add(raw: string): string | null {
    const name = normalizeIngredient(raw);
    if (!name) return 'Escribe un ingrediente.';
    if (this.ingredients().includes(name)) return `"${name}" ya está en la lista.`;
    if (this.ingredients().length >= MAX_INGREDIENTS) {
      return `Máximo ${MAX_INGREDIENTS} ingredientes.`;
    }
    this.ingredients.update((list) => [...list, name]);
    return null;
  }

  remove(name: string): void {
    this.ingredients.update((list) => list.filter((i) => i !== name));
  }

  clearIngredients(): void {
    this.ingredients.set([]);
  }

  search(): void {
    if (!this.canSearch()) return;

    this.running?.unsubscribe();
    const wanted = [...this.ingredients()];
    const myRun = ++this.runId;

    this.searchedWith.set(wanted);
    this.status.set('loading');
    this.results.set([]);

    this.running = forkJoin(
      wanted.map((i) => this.api.filterByIngredient(i).pipe(catchError(() => of(null)))),
    )
      .pipe(
        switchMap((lists) => {
          // Si ya hay otra búsqueda más nueva, abortamos esta sin tocar estado.
          if (myRun !== this.runId) return of(null);

          if (lists.every((l) => l === null)) {
            throw new Error('Sin respuesta de TheMealDB');
          }

          const ranked = this.rank(wanted, lists);
          this.results.set(ranked);
          this.status.set('done');

          // Segunda fase: el detalle trae medidas, necesarias para estimar calorías.
          return forkJoin(
            ranked.map((r) =>
              this.api.getById(r.id).pipe(catchError(() => of(null))),
            ),
          );
        }),
      )
      .subscribe({
        next: (recipes) => {
          if (!recipes || myRun !== this.runId) return;
          this.results.update((list) =>
            list.map((item, idx) => {
              const recipe = recipes[idx];
              return recipe
                ? { ...item, detail: 'ready', recipe, estimate: estimateRecipe(recipe) }
                : { ...item, detail: 'error', error: 'No se pudo cargar la receta' };
            }),
          );
        },
        error: () => {
          if (myRun === this.runId) this.status.set('error');
        },
      });
  }

  /** Ordena por cuántos ingredientes buscados contiene cada receta (más coincidencias primero). */
  private rank(wanted: readonly string[], lists: readonly (RecipeSummary[] | null)[]): RankedRecipe[] {
    const byId = new Map<string, RankedRecipe>();

    lists.forEach((list, idx) => {
      if (!list) return; // lista fallida → no aporta candidatos
      const term = wanted[idx];
      for (const meal of list) {
        const entry = byId.get(meal.id) ?? {
          ...meal,
          matches: [],
          detail: 'loading' as const,
        };
        if (!entry.matches.includes(term)) entry.matches.push(term);
        byId.set(meal.id, entry);
      }
    });

    return [...byId.values()]
      .sort(
        (a, b) =>
          b.matches.length - a.matches.length ||
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      )
      .slice(0, MAX_RESULTS);
  }
}