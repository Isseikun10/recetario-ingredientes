// ─────────────────────────────────────────────────────────────
// Recetas (dominio TheMealDB)
// ─────────────────────────────────────────────────────────────

/** Resumen que devuelve TheMealDB al filtrar por ingrediente. */
export interface RecipeSummary {
  id: string;
  name: string;
  thumb: string;
}

export interface RecipeIngredient {
  name: string;
  measure: string;
}

export interface Recipe extends RecipeSummary {
  category: string;
  area: string;
  instructions: string[];
  ingredients: readonly RecipeIngredient[];
  youtube: string | null;
  source: string | null;
}

// ─────────────────────────────────────────────────────────────
// Estimación calórica
// ─────────────────────────────────────────────────────────────

/** Origen del dato de gramos */
export type GramsSource = 'unit' | 'measure' | 'unknown';

/** Estimación calórica de un ingrediente concreto de una receta. */
export interface IngredientCalories {
  /** Nombre original tal como viene de TheMealDB. */
  name: string;
  /** Medida original tal como viene de TheMealDB (p. ej. "200g", "2 tbsp"). */
  measure: string;
  /** Clave canónica de la tabla de calorías, o `null` si no hubo match. */
  matchedKey: string | null;
  /** Gramos estimados, o `null` si no se pudo convertir. */
  grams: number | null;
  /** Cómo se obtuvieron los gramos (útil para depurar y mostrar avisos). */
  gramsSource: GramsSource;
  /** Kilocalorías estimadas, o `null` si no hay `kcal100` o `grams`. */
  kcal: number | null;
}

export interface CalorieEstimate {
  items: readonly IngredientCalories[];
  totalKcal: number; /** Ingredientes con estimación / ingredientes totales (0 a 1). */
  coverage: number;
  unresolved: readonly string[]; /** Ingredientes no resueltos, para avisar al usuario. */
}

// ─────────────────────────────────────────────────────────────
// Estado del listado / detalle
// ─────────────────────────────────────────────────────────────

export type DetailState = 'loading' | 'ready' | 'error';

/** Receta del listado de resultados, ordenada por coincidencias. */
export interface RankedRecipe extends RecipeSummary {
  /** Ingredientes buscados que contiene esta receta. */
  matches: readonly string[];
  detail: DetailState;
  recipe?: Recipe;
  estimate?: CalorieEstimate;
  error?: string;   /** Error del detalle, si `detail === 'error'`. */
}