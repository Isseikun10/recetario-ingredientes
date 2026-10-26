export interface CalorieEntry {
  /** Kilocalorías por 100 g  */
  kcal100: number;
  /**
   * Gramos de una unidad (1 cebolla, 1 huevo...).
   */
  unitGrams?: number;
}

/**
 * Unidades de medida que TheMealDB incluye en el campo `measure`.
 * Se usan para convertir cantidades a gramos de forma genérica.
 */
export type MeasureUnit =
  | 'g' | 'kg' | 'ml' | 'l'
  | 'tsp' | 'tbsp' | 'cup'
  | 'oz' | 'lb'
  | 'pinch' | 'dash' | 'handful'
  | 'clove' | 'slice' | 'piece' | 'can' | 'packet' | 'sprig';

/** Gramos equivalentes por unidad de medida (aproximados). */
export const MEASURE_TO_GRAMS: Readonly<Record<MeasureUnit, number>> = {
  g: 1, kg: 1000,
  ml: 1, l: 1000,
  tsp: 5, tbsp: 15, cup: 240,
  oz: 28.35, lb: 453.6,
  pinch: 0.5, dash: 1, handful: 30,
  clove: 3, slice: 25, piece: 100, can: 400, packet: 25, sprig: 2,
};

type Category =
  | 'meat' | 'seafood' | 'dairy' | 'egg' | 'grain' | 'sugar'
  | 'vegetable' | 'fruit' | 'nut' | 'fat' | 'sauce' | 'beverage'
  | 'sweet' | 'spice' | 'other';

interface TableEntry extends CalorieEntry {
  category: Category;
  /** Sinónimos / variantes que deben resolverse a esta entrada. */
  aliases?: readonly string[];
}

/**
 * Tabla base de calorías. Las claves van en inglés y en minúsculas porque
 * TheMealDB entrega los ingredientes así. El estimador busca primero la
 * coincidencia exacta y luego la clave más larga contenida en el nombre.
 */
const TABLE: Readonly<Record<string, TableEntry>> = {
  // ── Carnes ────────────────────────────────────────────────
  chicken:          { kcal100: 165, unitGrams: 150, category: 'meat' },
  'chicken breast': { kcal100: 165, unitGrams: 170, category: 'meat', aliases: ['chicken breasts'] },
  'chicken thigh':  { kcal100: 209, unitGrams: 110, category: 'meat', aliases: ['chicken thighs'] },
  beef:             { kcal100: 250, category: 'meat' },
  'minced beef':    { kcal100: 250, category: 'meat', aliases: ['ground beef', 'beef mince'] },
  lamb:             { kcal100: 294, category: 'meat' },
  pork:             { kcal100: 242, category: 'meat' },
  bacon:            { kcal100: 541, unitGrams: 8,   category: 'meat' },
  sausage:          { kcal100: 301, unitGrams: 60,  category: 'meat', aliases: ['sausages'] },
  ham:              { kcal100: 145, category: 'meat' },
  turkey:           { kcal100: 135, category: 'meat' },
  duck:             { kcal100: 337, category: 'meat' },

  // ── Pescados y mariscos ──────────────────────────────────
  salmon:    { kcal100: 208, unitGrams: 150, category: 'seafood' },
  tuna:      { kcal100: 132, category: 'seafood' },
  cod:       { kcal100: 82,  category: 'seafood' },
  haddock:   { kcal100: 90,  category: 'seafood' },
  mackerel:  { kcal100: 205, category: 'seafood' },
  anchovies: { kcal100: 210, unitGrams: 4, category: 'seafood', aliases: ['anchovy'] },
  prawn:     { kcal100: 99,  category: 'seafood', aliases: ['prawns'] },
  shrimp:    { kcal100: 99,  category: 'seafood' },
  mussels:   { kcal100: 86,  category: 'seafood', aliases: ['mussel'] },

  // ── Lácteos y huevo ──────────────────────────────────────
  milk:           { kcal100: 61,  category: 'dairy' },
  butter:         { kcal100: 717, category: 'dairy' },
  cheese:         { kcal100: 350, category: 'dairy' },
  cheddar:        { kcal100: 403, category: 'dairy' },
  parmesan:       { kcal100: 431, category: 'dairy', aliases: ['parmigiano'] },
  mozzarella:     { kcal100: 280, category: 'dairy' },
  feta:           { kcal100: 264, category: 'dairy' },
  'cream cheese': { kcal100: 342, category: 'dairy' },
  'sour cream':   { kcal100: 193, category: 'dairy' },
  'double cream': { kcal100: 340, category: 'dairy' },
  'heavy cream':  { kcal100: 340, category: 'dairy' },
  'single cream': { kcal100: 195, category: 'dairy' },
  cream:          { kcal100: 292, category: 'dairy' },
  yogurt:         { kcal100: 61,  category: 'dairy', aliases: ['yoghurt'] },
  'greek yogurt': { kcal100: 97,  category: 'dairy', aliases: ['greek yoghurt'] },
  egg:            { kcal100: 143, unitGrams: 50, category: 'egg', aliases: ['eggs'] },
  'egg yolk':     { kcal100: 322, unitGrams: 17, category: 'egg', aliases: ['egg yolks'] },
  'egg white':    { kcal100: 52,  unitGrams: 33, category: 'egg', aliases: ['egg whites'] },

  // ── Cereales y harinas ───────────────────────────────────
  flour:             { kcal100: 364, category: 'grain' },
  'self-raising flour': { kcal100: 354, category: 'grain', aliases: ['self raising flour'] },
  bread:             { kcal100: 265, unitGrams: 30, category: 'grain' },
  breadcrumbs:       { kcal100: 395, category: 'grain', aliases: ['bread crumbs'] },
  rice:              { kcal100: 360, category: 'grain' },
  pasta:             { kcal100: 371, category: 'grain' },
  spaghetti:         { kcal100: 371, category: 'grain' },
  penne:             { kcal100: 371, category: 'grain' },
  macaroni:          { kcal100: 371, category: 'grain' },
  noodles:           { kcal100: 360, category: 'grain' },
  oats:              { kcal100: 389, category: 'grain', aliases: ['oatmeal'] },
  couscous:          { kcal100: 376, category: 'grain' },
  tortilla:          { kcal100: 300, unitGrams: 40, category: 'grain', aliases: ['tortillas'] },
  cornstarch:        { kcal100: 381, category: 'grain', aliases: ['cornflour', 'corn flour'] },

  // ── Azúcares ─────────────────────────────────────────────
  sugar:         { kcal100: 387, category: 'sugar' },
  'brown sugar': { kcal100: 380, category: 'sugar' },
  'icing sugar': { kcal100: 389, category: 'sugar', aliases: ['powdered sugar'] },
  honey:         { kcal100: 304, category: 'sugar' },
  'maple syrup': { kcal100: 260, category: 'sugar' },

  // ── Verduras ─────────────────────────────────────────────
  onion:          { kcal100: 40,  unitGrams: 110, category: 'vegetable', aliases: ['onions'] },
  'spring onion': { kcal100: 32,  unitGrams: 15,  category: 'vegetable', aliases: ['spring onions', 'scallion'] },
  garlic:         { kcal100: 149, unitGrams: 3,   category: 'vegetable', aliases: ['clove garlic', 'garlic clove'] },
  potato:         { kcal100: 77,  unitGrams: 170, category: 'vegetable', aliases: ['potatoes'] },
  'sweet potato': { kcal100: 86,  unitGrams: 130, category: 'vegetable', aliases: ['sweet potatoes'] },
  carrot:         { kcal100: 41,  unitGrams: 60,  category: 'vegetable', aliases: ['carrots'] },
  tomato:         { kcal100: 18,  unitGrams: 120, category: 'vegetable', aliases: ['tomatoes'] },
  'chopped tomatoes': { kcal100: 21, category: 'vegetable', aliases: ['tinned tomatoes'] },
  'tomato puree': { kcal100: 82,  category: 'vegetable', aliases: ['tomato purée'] },
  'tomato paste': { kcal100: 82,  category: 'vegetable' },
  cucumber:       { kcal100: 15,  unitGrams: 200, category: 'vegetable', aliases: ['cucumbers'] },
  lettuce:        { kcal100: 15,  category: 'vegetable' },
  spinach:        { kcal100: 23,  category: 'vegetable' },
  broccoli:       { kcal100: 34,  category: 'vegetable' },
  cauliflower:    { kcal100: 25,  category: 'vegetable' },
  cabbage:        { kcal100: 25,  category: 'vegetable' },
  'red pepper':   { kcal100: 31,  unitGrams: 150, category: 'vegetable', aliases: ['red peppers', 'red bell pepper'] },
  'green pepper': { kcal100: 20,  unitGrams: 150, category: 'vegetable', aliases: ['green peppers', 'green bell pepper'] },
  chilli:         { kcal100: 40,  unitGrams: 15,  category: 'vegetable', aliases: ['chili', 'chillies', 'chilies'] },
  mushroom:       { kcal100: 22,  unitGrams: 20,  category: 'vegetable', aliases: ['mushrooms'] },
  courgette:      { kcal100: 17,  unitGrams: 200, category: 'vegetable', aliases: ['zucchini', 'courgettes'] },
  aubergine:      { kcal100: 25,  unitGrams: 300, category: 'vegetable', aliases: ['eggplant'] },
  celery:         { kcal100: 16,  unitGrams: 40,  category: 'vegetable' },
  leek:           { kcal100: 61,  unitGrams: 90,  category: 'vegetable', aliases: ['leeks'] },
  peas:           { kcal100: 81,  category: 'vegetable' },
  sweetcorn:      { kcal100: 86,  category: 'vegetable', aliases: ['corn'] },
  'green beans':  { kcal100: 31,  category: 'vegetable' },
  'kidney beans': { kcal100: 127, category: 'vegetable' },
  beans:          { kcal100: 127, category: 'vegetable' },
  chickpeas:      { kcal100: 164, category: 'vegetable', aliases: ['garbanzo'] },
  lentils:        { kcal100: 353, category: 'vegetable' },
  tofu:           { kcal100: 76,  category: 'vegetable' },

  // ── Frutas y frutos secos ────────────────────────────────
  lemon:         { kcal100: 29,  unitGrams: 60,  category: 'fruit', aliases: ['lemons'] },
  lime:          { kcal100: 30,  unitGrams: 45,  category: 'fruit', aliases: ['limes'] },
  orange:        { kcal100: 47,  unitGrams: 130, category: 'fruit', aliases: ['oranges'] },
  apple:         { kcal100: 52,  unitGrams: 180, category: 'fruit', aliases: ['apples'] },
  banana:        { kcal100: 89,  unitGrams: 120, category: 'fruit', aliases: ['bananas'] },
  avocado:       { kcal100: 160, unitGrams: 200, category: 'fruit', aliases: ['avocados'] },
  'coconut milk':  { kcal100: 197, category: 'fruit' },
  'coconut cream': { kcal100: 330, category: 'fruit' },
  raisins:       { kcal100: 299, category: 'fruit' },
  dates:         { kcal100: 282, category: 'fruit' },
  almonds:       { kcal100: 579, category: 'nut', aliases: ['almond'] },
  walnuts:       { kcal100: 654, category: 'nut', aliases: ['walnut'] },
  peanuts:       { kcal100: 567, category: 'nut', aliases: ['peanut'] },
  'peanut butter': { kcal100: 588, category: 'nut' },
  cashew:        { kcal100: 553, category: 'nut', aliases: ['cashews'] },
  'sesame seed': { kcal100: 573, category: 'nut', aliases: ['sesame seeds'] },

  // ── Aceites y grasas ─────────────────────────────────────
  'olive oil':     { kcal100: 884, category: 'fat' },
  'vegetable oil': { kcal100: 884, category: 'fat' },
  'sunflower oil': { kcal100: 884, category: 'fat' },
  'sesame oil':    { kcal100: 884, category: 'fat' },
  oil:             { kcal100: 884, category: 'fat' },
  lard:            { kcal100: 902, category: 'fat' },

  // ── Salsas, caldos y bebidas ─────────────────────────────
  'soy sauce':           { kcal100: 53,  category: 'sauce' },
  vinegar:               { kcal100: 18,  category: 'sauce' },
  'balsamic vinegar':    { kcal100: 88,  category: 'sauce' },
  mustard:               { kcal100: 66,  category: 'sauce' },
  ketchup:               { kcal100: 101, category: 'sauce' },
  mayonnaise:            { kcal100: 680, category: 'sauce', aliases: ['mayo'] },
  'worcestershire sauce':{ kcal100: 78,  category: 'sauce' },
  stock:                 { kcal100: 5,   category: 'sauce', aliases: ['broth'] },
  'white wine':          { kcal100: 82,  category: 'beverage' },
  'red wine':            { kcal100: 85,  category: 'beverage' },
  beer:                  { kcal100: 43,  category: 'beverage' },
  water:                 { kcal100: 0,   category: 'beverage' },
  salt:                  { kcal100: 0,   category: 'spice' },

  // ── Dulces y repostería ──────────────────────────────────
  cocoa:         { kcal100: 228, category: 'sweet', aliases: ['cocoa powder'] },
  chocolate:     { kcal100: 546, category: 'sweet' },
  'baking powder':{ kcal100: 53, category: 'sweet' },
  yeast:         { kcal100: 325, category: 'sweet' },
  vanilla:       { kcal100: 288, category: 'sweet', aliases: ['vanilla extract', 'vanilla essence'] },

  // ── Hierbas y especias ───────────────────────────────────
  'black pepper': { kcal100: 251, category: 'spice' },
  pepper:         { kcal100: 251, category: 'spice' },
  cinnamon:       { kcal100: 247, category: 'spice' },
  cumin:          { kcal100: 375, category: 'spice' },
  paprika:        { kcal100: 282, category: 'spice' },
  turmeric:       { kcal100: 312, category: 'spice' },
  oregano:        { kcal100: 265, category: 'spice' },
  basil:          { kcal100: 23,  category: 'spice' },
  parsley:        { kcal100: 36,  category: 'spice' },
  coriander:      { kcal100: 23,  category: 'spice', aliases: ['cilantro'] },
  thyme:          { kcal100: 101, category: 'spice' },
  rosemary:       { kcal100: 131, category: 'spice' },
  ginger:         { kcal100: 80,  category: 'spice' },
  'curry powder': { kcal100: 325, category: 'spice' },
  'chilli powder':{ kcal100: 282, category: 'spice', aliases: ['chili powder'] },
  nutmeg:         { kcal100: 525, category: 'spice' },
  'bay leaf':     { kcal100: 313, category: 'spice', aliases: ['bay leaves'] },
  mint:           { kcal100: 44,  category: 'spice' },
  dill:           { kcal100: 43,  category: 'spice' },
};

/** Tabla pública */
export const CALORIE_TABLE: Readonly<Record<string, CalorieEntry>> =
  Object.fromEntries(
    Object.entries(TABLE).map(([k, { kcal100, unitGrams }]) => [k, { kcal100, unitGrams }]),
  );

/** alias =clave canónica. */
export const ALIAS_TO_KEY: Readonly<Record<string, string>> = Object.freeze(
  Object.entries(TABLE).reduce<Record<string, string>>((acc, [key, entry]) => {
    for (const alias of entry.aliases ?? []) acc[alias] = key;
    return acc;
  }, {}),
);

/** Claves ordenadas de mayor a menor longitud. */
export const SORTED_KEYS: readonly string[] = Object.freeze(
  Object.keys(TABLE).sort((a, b) => b.length - a.length),
);