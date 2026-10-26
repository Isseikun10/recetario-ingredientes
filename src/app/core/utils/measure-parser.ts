/** Gramos aproximados por unidad de medida. Los líquidos se asumen con densidad ~1 g/ml. */
const UNIT_GRAMS: ReadonlyArray<readonly [RegExp, number]> = [
  [/^(kg|kgs|kilograms?|kilos?)\b/, 1000],
  [/^(g|gr|grams?|grammes?)\b/, 1],
  [/^(lbs?|pounds?)\b/, 453.6],
  [/^(oz|ounces?)\b/, 28.35],
  [/^(ml|millilit(?:re|er)s?|cc)\b/, 1],
  [/^(cl)\b/, 10],
  [/^(l|lit(?:re|er)s?)\b/, 1000],
  [/^cups?\b/, 240],
  [/^(tbsp|tbs|tbl|tablespoons?)\b/, 15],
  [/^(tsp|teaspoons?)\b/, 5],
  [/^(pinch(?:es)?|dash(?:es)?|sprinkling|sprigs?)\b/, 0.5],
  [/^handfuls?\b/, 30],
  [/^(cans?|tins?)\b/, 400],
  [/^slices?\b/, 30],
  [/^cloves?\b/, 3],
];

/**
 * Frases que indican "cantidad despreciable": no aportan calorías relevantes.
 * Se busca al final del texto para no confundir "garnish with parsley" (medida
 * real) con un "for garnish" al final.
 */
const NEGLIGIBLE = /\b(to taste|garnish|to serve|for serving|decorat\w*|as needed|optional)\b/;

const UNICODE_FRACTIONS: Readonly<Record<string, string>> = {
  '½': ' 1/2',
  '¼': ' 1/4',
  '¾': ' 3/4',
  '⅓': ' 1/3',
  '⅔': ' 2/3',
  '⅛': ' 1/8',
  '⅜': ' 3/8',
  '⅝': ' 5/8',
  '⅞': ' 7/8',
};

export interface ParsedMeasure {
  /** Cantidad numérica inicial (2, 0.5, 1.5...). null si no hay número. */
  quantity: number | null;
  /** Texto restante tras el número ("cup", "tbsp chopped", "large"...). */
  rest: string;
}

function toNumber(token: string): number | null {
  if (token.includes('/')) {
    const [a, b] = token.split('/').map(Number);
    return b ? a / b : null;
  }
  if (/^\d+(\.\d+)?[-–]\d+(\.\d+)?$/.test(token)) {
    const [a, b] = token.split(/[-–]/).map(Number);
    return (a + b) / 2;
  }
  const n = Number(token);
  return Number.isFinite(n) ? n : null;
}

/** "1 1/2 cups" -> { quantity: 1.5, rest: "cups" }; "200g" -> { 200, "g" }. */
export function parseMeasure(raw: string): ParsedMeasure {
  let text = raw.trim().toLowerCase().replace(/,/g, '.');
  for (const [symbol, replacement] of Object.entries(UNICODE_FRACTIONS)) {
    text = text.replaceAll(symbol, replacement);
  }
  text = text.replace(/(\d)([a-z])/g, '$1 $2');

  const tokens = text.split(/\s+/).filter(Boolean);
  let quantity: number | null = null;
  let consumed = 0;
  for (const token of tokens) {
    if (!/^[\d./\-–]+$/.test(token)) break;
    const value = toNumber(token);
    if (value === null) break;
    quantity = (quantity ?? 0) + value;
    consumed++;
  }
  return { quantity, rest: tokens.slice(consumed).join(' ') };
}

/**
 * Convierte una medida a gramos.
 * - Con unidad conocida: cantidad × gramos de esa unidad.
 * - Solo número ("2" cebollas): cantidad × `unitGrams` del ingrediente.
 * - Cantidad despreciable ("to taste"): 0 g.
 * - No se puede inferir: null (no se inventa un valor).
 */
export function measureToGrams(raw: string, unitGrams?: number): number | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  // "to taste" / "for garnish": cero calorías relevantes, pero es una
  // estimación deliberada, no un fallo de parseo.
  if (NEGLIGIBLE.test(text)) return 0;

  // Gramos explícitos en cualquier parte de la medida: "400g can", "1 (400g) can",
  // "2 x 200g", "200 g". Se comprueba antes que las unidades para no confundir
  // "400 g can" con la unidad "can".
  const explicit = text.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (explicit) {
    const { quantity } = parseMeasure(text);
    return (quantity ?? 1) * Number(explicit[1]);
  }

  const { quantity, rest } = parseMeasure(text);

  for (const [pattern, grams] of UNIT_GRAMS) {
    if (pattern.test(rest)) return (quantity ?? 1) * grams;
  }

  // "2 onions" sin unidad: usa el peso medio por unidad del ingrediente.
  if (quantity !== null && unitGrams !== undefined) return quantity * unitGrams;

  // "1 onion" sin unidad y sin unitGrams conocidos: asumimos 1 unidad.
  if (quantity === null && unitGrams !== undefined) return unitGrams;

  return null;
}