// ── Helpers básicos ───────────────────────────────────────────
export const n = v => parseFloat(v) || 0;
export const fmt = v => (+v).toFixed(2);
export const fDate = iso => { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };
export const uid = () => Math.random().toString(36).slice(2, 8);
export const fS = v => { const x = Math.round(v); return (x >= 0 ? "" : "-") + "S/" + Math.abs(x); };

// Color según ganancia neta
export const nc = net =>
  net > 100 ? { bg: "#16a34a", light: "#dcfce7", tx: "#fff", br: "#15803d" }
    : net > 0 ? { bg: "#ea580c", light: "#ffedd5", tx: "#fff", br: "#c2410c" }
      : { bg: "#dc2626", light: "#fee2e2", tx: "#fff", br: "#b91c1c" };

// ── Cálculo de costo unitario desde receta ────────────────────
// recipe.qty = cantidad por lote → costo/und = batchCost / loteSize
export function uCost(prod, ings) {
  const batch = prod.recipe.reduce((s, it) => {
    const ing = ings.find(i => i.id === it.ingId);
    return s + (ing ? n(it.qty) * n(ing.price) : 0);
  }, 0);
  return n(prod.loteSize) > 1 ? batch / n(prod.loteSize) : batch;
}

// ── Totales del día ───────────────────────────────────────────
export function dTotals(rec, prods, ings, cfg) {
  if (rec.status === "closed")
    return { net: 0, rev: 0, mat: 0, mermaTotal: 0, byP: {}, closed: true, opTotal: 0, total: 0 };

  let rev = 0, mat = 0, mermaTotal = 0;
  const byP = {};

  prods.forEach(p => {
    const e = rec.entries?.[p.id] || {};
    let pr = 0, pc = 0, pm = 0;

    if (p.mode === "units") {
      const sold = n(e.sold);
      pr = sold * n(p.price);
      const uc = uCost(p, ings);
      pc = (e.ingredientCost !== undefined && e.ingredientCost !== "")
        ? n(e.ingredientCost)
        : sold * uc;
      pm = Math.max(0, n(e.prepared) - sold) * uc;
    } else {
      pr = n(e.income);
      pc = n(e.ingredientCost);
      pm = n(e.merma);
    }

    byP[p.id] = { rev: pr, cost: pc, merma: pm, margin: pr - pc - pm };
    rev += pr; mat += pc; mermaTotal += pm;
  });

  const opTotal = (cfg.opCosts || []).reduce(
    (s, oc) => s + n(rec.opCosts?.[oc.id] ?? oc.defaultAmount), 0
  );

  return { byP, rev, mat, mermaTotal, opTotal, total: mat + mermaTotal + opTotal, net: rev - mat - mermaTotal - opTotal };
}