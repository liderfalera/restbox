# Restbox — Contexto del proyecto

## Qué es
SPA mobile-first (React 18 + Vite) para gestión diaria de un restaurante/negocio de comida.
Sin backend. Persistencia en `localStorage`. Max-width 480px. Desplegado en GitHub Pages.

**URL producción:** `https://liderfalera.github.io/restbox/`
**Repo:** `https://github.com/liderfalera/restbox`
**Deploy:** `npm run deploy` (gh-pages desde `dist/`)

---

## Estructura de archivos clave

```
src/
  App.jsx              — Estado global, tabs, modales, export/import
  utils.js             — Helpers puros: n, fmt, fDate, uid, uCost, dTotals, nc
  defaults.js          — Valores por defecto: D_CFG, D_INGS, D_PRODS, constantes
  components/
    ui.jsx             — Componentes UI: TC, Field, Btn, Toast, Modal, G2, CardHead, MarginBar
    forms.jsx          — Formularios config: CostForm, IngForm, ProdForm
    DayForm.jsx        — Formulario de registro diario
    DayDetail.jsx      — Detalle de un día en el historial
    Calendar.jsx       — Vista de calendario mensual
    Analysis.jsx       — Tab de análisis con métricas
    Logo.jsx           — SVG del logo (tenedor + caja)
public/
  manifest.json        — PWA manifest (nombre "Restbox", icono SVG)
  icon.svg             — Ícono app (fondo oscuro + logo blanco)
index.html             — Title "Restbox", favicon, theme-color, apple meta
vite.config.js         — base: '/restbox/' para gh-pages
```

---

## localStorage — claves de persistencia

| Clave | Contenido |
|-------|-----------|
| `rc3` | `cfg` — configuración general |
| `ri3` | `ings` — array de ingredientes |
| `rp3` | `prods` — array de platos |
| `rl3` | `log` — array de registros diarios |

---

## Modelos de datos

### cfg
```js
{
  objetivo: 100,          // meta de ganancia operativa/día (S/)
  fixedCosts: [],         // costos fijos mensuales
  opCosts: [],            // gastos operativos diarios
}
```

### fixedCost
```js
{ id, name, amount }  // amount = S/ por mes
```

### opCost
```js
{ id, name, defaultAmount }  // defaultAmount editable por día
```

### ingrediente
```js
{ id, name, unit, price }  // price = S/ por unidad (kg, litro, etc.)
```

### producto (plato)
```js
{
  id, name, emoji, color,
  price,          // precio de venta por unidad
  mode,           // "units" (se ingresan unidades vendidas) | "direct" (se ingresa caja)
  loteSize,       // unidades por lote de receta (ej. 27 juanes = 1 lote)
  recipe: [{ id, ingId, qty }]  // qty = cantidad del ingrediente por LOTE
}
```

### registro diario (log entry)
```js
{
  fecha: "YYYY-MM-DD",
  status: "open" | "closed",   // closed = día sin ventas
  entries: {
    [prodId]: {
      // mode === "units":
      sold,            // unidades vendidas
      prepared,        // unidades preparadas (merma = prepared - sold)
      ingredientCost,  // costo real de ingredientes (vacío = usa estimado de receta)
      // mode === "direct":
      income,          // ingresos totales de caja
      ingredientCost,
      merma,           // costo de merma manual
    }
  },
  opCosts: {
    [opCostId]: value  // monto real del día (vacío = usa defaultAmount)
  }
}
```

---

## Función central: `dTotals(rec, prods, ings, cfg)`

En `src/utils.js`. Es el único lugar donde se calculan los totales de un día.

**Retorna:**
```js
{
  byP: { [prodId]: { rev, cost, merma, margin } },
  rev,          // ingresos totales
  mat,          // costo de ingredientes total
  mermaTotal,   // merma total
  opTotal,      // gastos operativos del día
  total,        // mat + mermaTotal + opTotal
  net,          // rev - mat - mermaTotal - opTotal  ← ganancia operativa del día
  closed,       // true si status === "closed"
}
```

**IMPORTANTE:** Los costos fijos mensuales NO se descuentan en `dTotals`. Solo aparecen en el tab de Análisis, sumados una vez por mes. Esto es intencional: el "resultado mensual real" = suma de `net` de los días − `totalFixed`.

---

## Costo unitario: `uCost(prod, ings)`

```js
costo/und = batchCost / loteSize
// batchCost = suma de (qty_ingrediente × precio_ingrediente) para todo el lote
```

Si `loteSize = 1`, el costo del lote es el costo por unidad directamente.

---

## Tabs de la app

| Índice | Nombre | Contenido |
|--------|--------|-----------|
| 0 | Config | Configuración general, costos fijos, gastos op., ingredientes, platos. Botones Exportar/Importar. |
| 1 | Día | `DayForm` — registrar o editar un día |
| 2 | Historial | `Calendar` + `DayDetail` al seleccionar un día |
| 3 | Análisis | `Analysis` — métricas y tendencias |

---

## Export / Import (tab Config)

Dos botones: **Exportar** e **Importar**, cada uno abre un modal con dos opciones:

- **Configuración** → JSON con `{ version: 3, cfg, ingredients, products }` — archivo `config_YYYY-MM-DD.json`
- **Ventas** → JSON con `{ version: 3, log }` — archivo `ventas_YYYY-MM-DD.json`

Los archivos de prueba `config_inicial.json` y `ventas_abril2026.json` son locales y están en `.gitignore`. **Nunca commitear.**

---

## Análisis — secciones

1. **Filtro de período** — fecha desde/hasta (type="date", filtra `openLog`)
2. **Tarjetas resumen** — acumulado op., promedio/día, mejor día, peor día
3. **Merma acumulada** — solo si hay merma
4. **Tendencia 7 días** — últimos 7 vs 7 anteriores (requiere ≥8 días)
5. **Comparativa mes anterior** — muestra resultado del mes previo (requiere ≥2 meses)
6. **Días para cubrir fijos** — `ceil(totalFixed / avg)` (solo si hay fixedCosts)
7. **Resultado por mes** — operativo acumulado − costos fijos = resultado real; delta vs mes anterior
8. **Estrella del menú** — plato con mayor margen acumulado
9. **Rendimiento por plato** — barra de margen %, S/ margen, prom/día
10. **Promedio por día de semana** — barra de ganancia media por día de la semana

---

## Componentes UI reutilizables (`ui.jsx`)

- `TC.card` — estilo base de tarjeta (aplicar con spread)
- `Field` — input con label, nota, placeholder. `type` por defecto = "number"
- `Btn` — botón con variantes `outline`, `small`, `full`, `disabled`
- `G2` — grid 2 columnas
- `CardHead` — cabecera de sección con icon, title, color, right. Colores: green/blue/red/yellow/purple/gray/dark
- `Modal` — overlay centrado en pantalla, cierra al hacer click fuera
- `Toast` — notificación temporal flotante (2.5s)
- `MarginBar` — barra visual de margen (usada en Config → platos)

---

## Helpers (`utils.js`)

| Helper | Uso |
|--------|-----|
| `n(v)` | `parseFloat(v) \|\| 0` — convierte cualquier valor a número |
| `fmt(v)` | `(+v).toFixed(2)` — formatea a 2 decimales |
| `fDate(iso)` | `"YYYY-MM-DD"` → `"DD/MM/YYYY"` solo para mostrar |
| `uid()` | ID aleatorio corto para IDs de entidades |
| `nc(net)` | Devuelve `{ bg, light, tx, br }` según ganancia neta (verde/naranja/rojo) |

---

## Fechas — convención importante

- **Almacenamiento:** siempre `"YYYY-MM-DD"` (string ISO local, sin timezone)
- **Inputs type="date":** usan el string YYYY-MM-DD directamente — NO convertir a text
- **Display:** usar `fDate()` para mostrar en formato dd/mm/yyyy
- **Fecha por defecto en DayForm:** `localToday()` — construye la fecha desde `new Date()` en local (no UTC)

---

## Lo que NO existe / decisiones de diseño

- **Sin diasMes ni fpd:** Los costos fijos no se prorratean por día. Se muestran solo en Análisis, una vez por mes.
- **Sin backend:** Todo es localStorage. No hay IndexedDB, no hay servidor.
- **Sin autenticación:** App de uso personal/local.
- **Sin i18n:** Solo español.
- **Sin router:** Una sola página, navegación por estado `tab`.

---

## Deploy

```bash
npm run build   # genera dist/
npm run deploy  # sube a rama gh-pages via gh-pages package
git push origin main  # separado del deploy
```

`vite.config.js` tiene `base: '/restbox/'` obligatorio para que funcionen los assets en gh-pages.
