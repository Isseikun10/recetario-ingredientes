import { ALIAS_TO_KEY, CALORIE_TABLE, SORTED_KEYS, CalorieEntry } from '../data/calorie-table';
import { CalorieEstimate, GramsSource, IngredientCalories, Recipe } from '../models/recipe.model';
import { measureToGrams } from './measure-parser';

// ─────────────────────────────────────────────────────────────
// Normalización y singularización
// ─────────────────────────────────────────────────────────────

/** Formas irregulares que `singular()` no cubre. */
const IRREGULAR: Readonly<Record<string, string>> = {
  leaves: 'leaf',
  potatoes: 'potato',
  tomatoes: 'tomato',
  anchovies: 'anchovy',
  chilies: 'chilli',
  chillies: 'chilli',
};

/** Cachea normalizaciones: cada nombre se normaliza una sola vez por proceso. */
const normalizeCache = new Map<string, string>();

/** Quita plurales simples para que "tomatoes" coincida con "tomato". */
function singular(word: string): string {
  const irregular = IRREGULAR[word];
  if (irregular) return irregular;
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('oes')) return word.slice(0, -2);
  if (word.endsWith('ss')) return word;
  return word.endsWith('s') ? word.slice(0, -1) : word;
}

function normalize(name: string): string {
  const cached = normalizeCache.get(name);
  if (cached !== undefined) return cached;

  const result = name
    .toLowerCase()
    .split(/\s+/)
    .map(singular)
    .join(' ')
    .trim();

  normalizeCache.set(name, result);
  return result;
}

// ─────────────────────────────────────────────────────────────
// Búsqueda en la tabla
// ─────────────────────────────────────────────────────────────

/**
 * Busca la entrada de la tabla para un ingrediente.
 * Orden: alias exacto → clave exacta → clave canónica normalizada →
 * clave más larga contenida en el nombre normalizado.
 */
export function findEntryKey(ingredientName: string): string | null {
  const lower = ingredientName.toLowerCase().trim();
  if (!lower) return null;

  // 1. Alias explícito (plurales, variantes ortográficas…).
  const alias = ALIAS_TO_KEY[lower];
  if (alias) return alias;

  // 2. Clave exacta.
  if (CALORIE_TABLE[lower]) return lower;

  // 3. Comparación normalizada (singular + espacios colapsados).
  const normalized = normalize(lower);
  for (const key of SORTED_KEYS) {
    if (normalized === normalize(key)) return key;
  }

  // 4. Subcadena: la clave más larga contenida gana.
  for (const key of SORTED_KEYS) {
    if (normalized.includes(normalize(key))) return key;
  }

  return null;
}

/** Igual que `findEntryKey` pero devuelve la entrada completa. */
export function findEntry(ingredientName: string): CalorieEntry | null {
  const key = findEntryKey(ingredientName);
  return key ? CALORIE_TABLE[key] : null;
}

// ─────────────────────────────────────────────────────────────
// Estimación
// ─────────────────────────────────────────────────────────────

function buildItem(
  name: string,
  measure: string,
  key: string | null,
  grams: number | null,
  gramsSource: GramsSource,
): IngredientCalories {
  const kcal =
    key !== null && grams !== null
      ? Math.round((grams * CALORIE_TABLE[key].kcal100) / 100)
      : null;

  return { name, measure, matchedKey: key, grams, gramsSource, kcal };
}

export function estimateIngredient(name: string, measure: string): IngredientCalories {
  const key = findEntryKey(name);
  if (!key) return buildItem(name, measure, null, null, 'unknown');

  const grams = measureToGrams(measure, CALORIE_TABLE[key].unitGrams);
  if (grams === null) return buildItem(name, measure, key, null, 'unknown');

  const gramsSource: GramsSource = measure.trim() ? 'measure' : 'unit';
  return buildItem(name, measure, key, grams, gramsSource);
}

/**
 * Estimación de la receta completa.
 * TheMealDB no informa cuántas porciones rinde, así que `totalKcal` es el
 * total de la receta entera (no por ración).
 */
export function estimateRecipe(recipe: Recipe): CalorieEstimate {
  const items = recipe.ingredients.map((i) => estimateIngredient(i.name, i.measure));

  let totalKcal = 0;
  const unresolved: string[] = [];

  for (const item of items) {
    if (item.kcal !== null) totalKcal += item.kcal;
    else unresolved.push(item.name);
  }

  const coverage = items.length ? (items.length - unresolved.length) / items.length : 0;

  return { items, totalKcal, coverage, unresolved };
}