export const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const WDAYS = ["D", "L", "M", "X", "J", "V", "S"];
export const WDAYS_L = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const PCOLORS = ["#16a34a", "#ea580c", "#2563eb", "#7c3aed", "#db2777", "#d97706", "#0891b2", "#0f766e"];
export const UNITS = ["kg", "litro", "unidad", "paquete", "g", "atado", "botella", "porción", "otro"];

export const D_CFG = {
  diasMes: 24,
  objetivo: 100,
  fixedCosts: [
    { id: "fc1", name: "Alquiler", amount: 500 },
    { id: "fc2", name: "Gas", amount: 165 },
    { id: "fc3", name: "Luz", amount: 50 },
    { id: "fc4", name: "Agua", amount: 20 },
  ],
  opCosts: [
    { id: "oc1", name: "Personal", defaultAmount: 45 },
    { id: "oc2", name: "Bolsas", defaultAmount: 11.5 },
    { id: "oc3", name: "Refresco (cebada + azúcar)", defaultAmount: 9 },
  ],
};

export const D_INGS = [
  { id: "i1", name: "Arroz", unit: "kg", price: 3.30 },
  { id: "i2", name: "Pollo", unit: "kg", price: 13 },
  { id: "i3", name: "Bijao", unit: "paquete", price: 5 },
  { id: "i4", name: "Aceitunas mini", unit: "unidad", price: 0.11 },
  { id: "i5", name: "Condimentos juane", unit: "porción", price: 1 },
  { id: "i6", name: "Harina broaster", unit: "kg", price: 7 },
  { id: "i7", name: "Aceite", unit: "litro", price: 8 },
  { id: "i8", name: "Papas", unit: "kg", price: 1.80 },
  { id: "i9", name: "Hotdog chaufa", unit: "unidad", price: 0.25 },
  { id: "i10", name: "Hierbas chaufa", unit: "atado", price: 2 },
  { id: "i11", name: "Sillao", unit: "botella", price: 3 },
  { id: "i12", name: "Cremas", unit: "porción", price: 15 },
  { id: "i13", name: "Ensalada", unit: "porción", price: 5 },
  { id: "i14", name: "Plátano", unit: "kg", price: 2.70 },
  { id: "i15", name: "Fideo", unit: "kg", price: 4 },
  { id: "i16", name: "Huevo", unit: "unidad", price: 0.67 },
  { id: "i17", name: "Hierba caldo", unit: "atado", price: 3 },
  { id: "i18", name: "Limón", unit: "kg", price: 3.50 },
];

// recipe.qty = cantidad POR LOTE (no por unidad)
// loteSize   = unidades que produce ese lote
// costo/und  = Σ(qty × price) / loteSize
export const D_PRODS = [
  {
    id: "p1", name: "Juane", emoji: "🍃", color: "#16a34a",
    price: 3, mode: "units", loteSize: 27,
    recipe: [
      { id: "r1", ingId: "i1", qty: 3 },  // 3 kg arroz
      { id: "r2", ingId: "i2", qty: 0.8 },  // 800 g pollo
      { id: "r3", ingId: "i3", qty: 1.35 },  // 1.35 paquetes bijao
      { id: "r4", ingId: "i4", qty: 27 },  // 27 aceitunas (1 c/u)
      { id: "r5", ingId: "i5", qty: 1 },  // 1 porción condimentos
    ],
  },
  {
    id: "p2", name: "Broaster", emoji: "🍗", color: "#ea580c",
    price: 8, mode: "direct", loteSize: 1,
    recipe: [],
  },
  {
    id: "p3", name: "Caldo", emoji: "🍲", color: "#2563eb",
    price: 6.50, mode: "units", loteSize: 15,
    recipe: [
      { id: "r7", ingId: "i2", qty: 1.02 },  // ~1 kg pollo
      { id: "r8", ingId: "i14", qty: 3 },  // 3 kg plátano
      { id: "r9", ingId: "i15", qty: 0.5 },  // 500 g fideo
      { id: "r10", ingId: "i16", qty: 15 },  // 15 huevos
      { id: "r11", ingId: "i18", qty: 2 },  // 2 kg limón
      { id: "r12", ingId: "i17", qty: 1 },  // 1 atado hierba
    ],
  },
];