// TheMealDB devuelve categorías y regiones en inglés; aquí las paso a español.
// Si llega algo que no está en la lista, se muestra tal cual.

const CATEGORY_ES: Readonly<Record<string, string>> = {
  Beef: 'Res',
  Breakfast: 'Desayuno',
  Chicken: 'Pollo',
  Dessert: 'Postre',
  Goat: 'Cabrito',
  Lamb: 'Cordero',
  Miscellaneous: 'Varios',
  Pasta: 'Pasta',
  Pork: 'Cerdo',
  Seafood: 'Mariscos',
  Side: 'Guarnición',
  Starter: 'Entrada',
  Vegan: 'Vegano',
  Vegetarian: 'Vegetariano',
};

const AREA_ES: Readonly<Record<string, string>> = {
  Algerian: 'Argelina',
  American: 'Estadounidense',
  Argentinian: 'Argentina',
  Australian: 'Australiana',
  British: 'Británica',
  Canadian: 'Canadiense',
  Chinese: 'China',
  Croatian: 'Croata',
  Dutch: 'Neerlandesa',
  Egyptian: 'Egipcia',
  Filipino: 'Filipina',
  French: 'Francesa',
  Greek: 'Griega',
  Indian: 'India',
  Irish: 'Irlandesa',
  Italian: 'Italiana',
  Jamaican: 'Jamaicana',
  Japanese: 'Japonesa',
  Kenyan: 'Keniana',
  Malaysian: 'Malasia',
  Mexican: 'Mexicana',
  Moroccan: 'Marroquí',
  Norwegian: 'Noruega',
  Polish: 'Polaca',
  Portuguese: 'Portuguesa',
  Russian: 'Rusa',
  'Saudi Arabian': 'Saudí',
  Slovakian: 'Eslovaca',
  Spanish: 'Española',
  Syrian: 'Siria',
  Thai: 'Tailandesa',
  Tunisian: 'Tunecina',
  Turkish: 'Turca',
  Ukrainian: 'Ucraniana',
  Uruguayan: 'Uruguaya',
  // sí, así viene escrito en la API (Venezulan)
  Venezulan: 'Venezolana',
  Vietnamese: 'Vietnamita',
  Unknown: 'Desconocida',
};

export function translateCategory(value: string): string {
  return CATEGORY_ES[value] ?? value;
}

export function translateArea(value: string): string {
  return AREA_ES[value] ?? value;
}
