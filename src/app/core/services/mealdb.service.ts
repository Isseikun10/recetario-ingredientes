import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay, tap } from 'rxjs';

import { Recipe, RecipeIngredient, RecipeSummary } from '../models/recipe.model';

type MealDto = Record<string, string | null>;

interface MealsResponse {
  meals: MealDto[] | null;
}

const MAX_INGREDIENTS_IN_DTO = 20;
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

@Injectable({ providedIn: 'root' })
export class MealdbService {
  private readonly http = inject(HttpClient);

  private readonly detailCache = new Map<string, Recipe>();
  private ingredientNames$?: Observable<readonly string[]>;
  /** Peticiones por id, para no duplicar llamadas concurrentes. */
  private readonly inflightDetail = new Map<string, Observable<Recipe | null>>();

  /**
   * La API gratuita solo filtra por UN ingrediente; el cruce de varios
   * se hace en el cliente.
   */
  filterByIngredient(ingredient: string): Observable<RecipeSummary[]> {
    const normalized = ingredient.trim().replace(/\s+/g, '_');
    if (!normalized) return of([]);

    return this.http
      .get<MealsResponse>(`${BASE_URL}/filter.php?i=${encodeURIComponent(normalized)}`)
      .pipe(
        map((res) => (res.meals ?? []).map((m) => this.toSummary(m))),
      );
  }

  getById(id: string): Observable<Recipe | null> {
    if (!id) return of(null);

    const cached = this.detailCache.get(id);
    if (cached) return of(cached);

    // Si ya hay una petición en vuelo para este id, compártela.
    const inflight = this.inflightDetail.get(id);
    if (inflight) return inflight;

    const request$ = this.http
      .get<MealsResponse>(`${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`)
      .pipe(
        map((res) => (res.meals?.[0] ? this.toRecipe(res.meals[0]) : null)),
        tap((recipe) => {
          if (recipe) this.detailCache.set(id, recipe);
          this.inflightDetail.delete(id);
        }),
        shareReplay(1),
      );

    this.inflightDetail.set(id, request$);
    return request$;
  }

  /**
   * Lista de ingredientes válidos, usada para autocompletar. Se pide una sola
   * vez y se comparte entre suscriptores.
   */
  listIngredientNames(): Observable<readonly string[]> {
    this.ingredientNames$ ??= this.http
      .get<MealsResponse>(`${BASE_URL}/list.php?i=list`)
      .pipe(
        map((res) =>
          (res.meals ?? [])
            .map((m) => (m['strIngredient'] ?? '').trim().toLowerCase())
            .filter((name): name is string => name.length > 0),
        ),
        map((names) => Array.from(new Set(names)).sort()),
        shareReplay(1),
      );

    return this.ingredientNames$;
  }

  /** Invalida el caché en memoria (útil en tests o al forzar refresco). */
  clearCache(): void {
    this.detailCache.clear();
    this.inflightDetail.clear();
    this.ingredientNames$ = undefined;
  }

  // ── Mapeo DTO → dominio ─────────────────────────────────

  private toSummary(dto: MealDto): RecipeSummary {
    return {
      id: dto['idMeal'] ?? '',
      name: dto['strMeal'] ?? '',
      thumb: dto['strMealThumb'] ?? '',
    };
  }

  private toRecipe(dto: MealDto): Recipe {
    return {
      ...this.toSummary(dto),
      category: dto['strCategory']?.trim() ?? '',
      area: dto['strArea']?.trim() ?? '',
      instructions: this.toSteps(dto['strInstructions'] ?? ''),
      ingredients: this.toIngredients(dto),
      youtube: this.toNullableUrl(dto['strYoutube']),
      source: this.toNullableUrl(dto['strSource']),
    };
  }

  private toIngredients(dto: MealDto): RecipeIngredient[] {
    const ingredients: RecipeIngredient[] = [];

    for (let i = 1; i <= MAX_INGREDIENTS_IN_DTO; i++) {
      const name = dto[`strIngredient${i}`]?.trim();
      if (!name) continue;

      ingredients.push({
        name,
        measure: dto[`strMeasure${i}`]?.trim() ?? '',
      });
    }

    return ingredients;
  }

  /** Divide el texto en pasos y descarta encabezados sueltos como "STEP 1" o "2.". */
  private toSteps(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^(step\s*\d+|\d+\.?)$/i.test(line));
  }

  private toNullableUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}