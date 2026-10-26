# Recetario por ingredientes

Aplicación web en **Angular 20** desplegada en **Firebase Hosting**. Ingresas de 2 a 5 ingredientes y la app lista recetas que los usan, con una **estimación calórica básica**, el detalle con pasos y una **gráfica de barras de calorías por ingrediente**. Las recetas favoritas se guardan en **localStorage**.

- URL pública: _pendiente de publicar_ (`https://TU-PROJECT-ID.web.app`)
- Datos: [TheMealDB](https://www.themealdb.com/api.php) (API gratuita, clave de prueba `1`)

## Decisiones de diseño

| Requisito | Decisión |
| --- | --- |
| Core | Búsqueda por ingredientes en TheMealDB + detalle con ingredientes y pasos |
| Mi toque | Gráfica de barras de calorías por ingrediente (HTML + Tailwind, sin librerías) |
| Persistencia | localStorage para favoritos (sin login, sin backend que mantener) |

## Cómo funciona

1. **Búsqueda.** La API gratuita solo filtra por *un* ingrediente a la vez. Se hace una petición por ingrediente y el cruce se resuelve en el cliente: cada receta se ordena por cuántos de tus ingredientes contiene ("Coincide con 2 de 3"). Así siempre hay resultados útiles aunque ninguna receta tenga todos.
2. **Detalle.** Para estimar calorías hace falta la lista de medidas, que solo viene en el detalle de cada receta. Los resultados aparecen primero y las calorías se completan después (estado "Calculando calorías…").
3. **Calorías.** Se parsea cada medida (`1 1/2 cups`, `200g`, `2 tbsp`, `to taste`...) a gramos y se multiplica por kcal/100 g de una tabla base. Si no se puede inferir un valor, **se deja sin estimar en vez de inventarlo**, y la interfaz muestra qué porcentaje de ingredientes se pudo cubrir.
4. **Favoritos.** Se guardan en `localStorage` y se validan al leerlos (si el dato está corrupto, se ignora).

## Estructura

```
src/app/
├── core/
│   ├── data/calorie-table.ts          # tabla base kcal/100 g
│   ├── models/recipe.model.ts         # interfaces del dominio
│   ├── services/
│   │   ├── mealdb.service.ts          # acceso a TheMealDB (HttpClient + caché de detalle)
│   │   ├── search-state.service.ts    # estado de la búsqueda compartido (signals)
│   │   └── favorites.service.ts       # favoritos + localStorage
│   └── utils/
│       ├── measure-parser.ts          # "1 1/2 cups" -> gramos (función pura)
│       └── calorie-estimator.ts       # estimación por ingrediente y por receta (pura)
├── features/
│   ├── search/                        # página de búsqueda y resultados
│   ├── recipe-detail/                 # detalle + gráfica
│   └── favorites/                     # favoritos
└── shared/
    ├── recipe-card.ts
    └── calorie-chart.ts
```

La lógica de calorías vive en funciones puras sin dependencias de Angular, para poder probarla de forma aislada. El estado de la búsqueda está en un servicio con signals para que los resultados sigan ahí al volver desde el detalle.

## Uso de IA (y cómo lo acoté)

Usé IA (Claude) para acelerar el andamiaje y para contrastar ideas; las decisiones de producto y de UX las tomé yo.

- **Qué le pedí:** el esqueleto Angular + Tailwind, la tabla base de calorías, el parser de medidas y la gráfica de barras.
- **Dónde NO la usé como fuente de verdad:** las calorías. Los valores de la tabla son aproximados (referencia tipo USDA) y los revisé por categorías. Cualquier número que muestra la app es una **estimación**, y la interfaz lo dice en el detalle y en el pie de página.
- **Qué verifiqué yo:**
  - Que el parser maneje los formatos reales de TheMealDB (fracciones, rangos, unidades pegadas al número, "to taste").
  - Que lo desconocido devuelva `null` y no un número inventado.
  - Casos de prueba en `calorie-estimator.spec.ts`.
- **Límites conocidos:** no sabe cuántas porciones rinde cada receta (la API no lo informa), así que las calorías son de la receta completa; los ingredientes fuera de la tabla no suman; los líquidos se asumen con densidad ~1 g/ml.

## Ejecutar en local

Requisitos: Node 22.22.3+ (o 24.15+) y npm.

```bash
npm install
npm start          # http://localhost:4200
npm test           # pruebas unitarias del estimador
npm run build      # genera dist/recetario-ingredientes/browser
```

## Publicar en Firebase Hosting

1. Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com/) (no necesitas activar Firestore).
2. Reemplaza `TU-PROJECT-ID` en `.firebaserc` por el ID de tu proyecto.
3. Publica:

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

`firebase.json` ya apunta a `dist/recetario-ingredientes/browser` y reescribe todas las rutas a `index.html` para que `/receta/:id` y `/favoritos` funcionen al recargar.

## Mejoras si hubiera más tiempo

- Sustituciones sugeridas o lista de compras como segundo "toque".
- Porciones configurables para ver calorías por porción.
- Migrar favoritos a Firestore con autenticación anónima para sincronizar entre dispositivos.