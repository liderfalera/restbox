import { useState, useMemo } from 'react';
import { Field, Btn, G2, CardHead, TC } from './ui.jsx';
import { n, fmt, uCost, dTotals, nc } from '../utils.js';

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const blank = () => ({
  fecha: localToday(),
  status: "open",
  entries: {},
  opCosts: {},
});

export default function DayForm({ initial, prods, ings, cfg, onSave, onCancel, isEdit }) {
  const [d, setD] = useState(initial || blank());
  const sd  = (k, v) => setD(x => ({ ...x, [k]:v }));
  const setE = (pid, k, v) => setD(x => ({ ...x, entries:{ ...x.entries, [pid]:{ ...(x.entries[pid]||{}), [k]:v } } }));
  const setOp = (oid, v) => setD(x => ({ ...x, opCosts:{ ...x.opCosts, [oid]:v } }));

  const tots = useMemo(() => dTotals(d, prods, ings, cfg), [d, prods, ings, cfg]);
  const col  = nc(tots.net);

  return (
    <div>
      {/* Header + fecha */}
      <div style={{ ...TC.card, padding:0 }}>
        <CardHead
          icon={isEdit ? "✏️" : "📝"}
          title={isEdit ? "Editando día" : "Registrar día"}
          color="dark"
          right={
            <button onClick={() => sd("status", d.status==="closed" ? "open" : "closed")}
              style={{ fontSize:11,color:"#fff",background:"rgba(255,255,255,0.15)",border:"none",borderRadius:999,padding:"5px 12px",cursor:"pointer",fontWeight:600 }}>
              {d.status==="closed" ? "🔓 Reabrir" : "🔒 Cerrar día"}
            </button>
          }
        />
        <div style={{ padding:12 }}>
          <Field label="📅 Fecha" value={d.fecha} onChange={v=>sd("fecha",v)} type="date"/>
        </div>
      </div>

      {d.status === "closed" ? (
        <div style={{ ...TC.card, padding:32, textAlign:"center" }}>
          <div style={{ fontSize:44, marginBottom:8 }}>🔒</div>
          <p style={{ fontSize:14, color:"#475569", fontWeight:700, margin:0 }}>Día cerrado — sin ventas</p>
        </div>
      ) : (
        <>
          {/* Un bloque por producto */}
          {prods.map(p => {
            const e    = d.entries[p.id] || {};
            const uc   = uCost(p, ings);
            const sold = n(e.sold);
            const eRev = p.mode==="units" ? sold*n(p.price) : n(e.income);
            const eCost = (e.ingredientCost !== undefined && e.ingredientCost !== "")
              ? n(e.ingredientCost)
              : (p.mode==="units" ? sold*uc : n(e.ingredientCost));
            const mermaU = p.mode==="units" ? Math.max(0, n(e.prepared)-sold) : 0;
            const merma  = p.mode==="units" ? mermaU*uc : n(e.merma);
            const margin = eRev - eCost - merma;

            return (
              <div key={p.id} style={{ ...TC.card, padding:0 }}>
                <div style={{ background:`linear-gradient(135deg,${p.color},${p.color}cc)`, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:22 }}>{p.emoji}</span>
                  <div style={{ flex:1 }}>
                    <span style={{ color:"#fff", fontWeight:800, fontSize:14 }}>{p.name}</span>
                    <span style={{ color:"rgba(255,255,255,0.75)", fontSize:11, marginLeft:8 }}>
                      S/{fmt(n(p.price))} · {p.mode==="units" ? `Costo est: S/${fmt(uc)}/und` : "Caja directa"}
                    </span>
                  </div>
                </div>
                <div style={{ padding:12 }}>
                  {p.mode==="units" ? (
                    <>
                      <G2>
                        <Field label="🍽️ Platos preparados" value={e.prepared||""} onChange={v=>setE(p.id,"prepared",v)} note="Total que preparaste hoy"/>
                        <Field label="📦 Platos vendidos"   value={e.sold||""}     onChange={v=>setE(p.id,"sold",v)}     note={e.sold?`💵 = S/${fmt(sold*n(p.price))}`:""}/>
                      </G2>
                      <Field label="🛒 Costo ingredientes (S/)" value={e.ingredientCost||""} onChange={v=>setE(p.id,"ingredientCost",v)}
                        placeholder={sold>0?`Est: S/${fmt(sold*uc)}`:"0"}
                        note="Deja vacío para usar estimado de la receta"/>
                      {mermaU > 0 && (
                        <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, padding:"6px 10px", marginTop:4, fontSize:12, color:"#9a3412", fontWeight:600 }}>
                          🗑️ Merma: {mermaU} plato{mermaU!==1?"s":""} ≈ S/{fmt(merma)}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <G2>
                        <Field label="💵 Ingresos totales (S/)"   value={e.income||""}          onChange={v=>setE(p.id,"income",v)}          note="Total en caja de este plato"/>
                        <Field label="🛒 Costo ingredientes (S/)" value={e.ingredientCost||""}   onChange={v=>setE(p.id,"ingredientCost",v)}  note="Lo que gastaste en ingredientes"/>
                      </G2>
                      <Field label="🗑️ Merma estimada (S/)" value={e.merma||""} onChange={v=>setE(p.id,"merma",v)}
                        placeholder="0" note="Costo de ingredientes desperdiciados (pollo, aceite, etc.)"/>
                    </>
                  )}

                  {(eRev>0||eCost>0) && (
                    <div style={{ background:margin>=0?"#f0fdf4":"#fef2f2", borderRadius:8, padding:"6px 10px", marginTop:4, display:"flex", justifyContent:"space-between", fontSize:12 }}>
                      <span style={{ color:"#64748b" }}>
                        💵 S/{fmt(eRev)} − 🛒 S/{fmt(eCost)}{merma>0?` − 🗑️ S/${fmt(merma)}`:""}
                      </span>
                      <span style={{ fontWeight:700, color:margin>=0?"#16a34a":"#dc2626" }}>= S/{fmt(margin)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Gastos operativos */}
          <div style={{ ...TC.card, padding:0 }}>
            <CardHead icon="💸" title="Gastos operativos del día" color="blue"/>
            <div style={{ padding:12 }}>
              <G2>
                {(cfg.opCosts||[]).map(oc => (
                  <Field key={oc.id} label={`${oc.name} (S/)`}
                    value={d.opCosts?.[oc.id] ?? oc.defaultAmount}
                    onChange={v=>setOp(oc.id,v)}/>
                ))}
              </G2>
              <div style={{ fontSize:11, color:"#64748b", background:"#f1f5f9", borderRadius:8, padding:"5px 10px", marginTop:4 }}>
                🏠 Provisión fijos: S/{fmt(tots.fpd)}/día (calculada automáticamente)
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div style={{ background:`linear-gradient(135deg,${col.light},${col.light}99)`, border:`1.5px solid ${col.br}40`, borderRadius:16, padding:14, marginBottom:12 }}>
            <p style={{ fontSize:12, fontWeight:800, color:"#1e293b", margin:"0 0 10px" }}>📊 Resumen del día</p>
            {prods.map(p => {
              const bp = tots.byP[p.id] || { rev:0, cost:0, merma:0, margin:0 };
              return (bp.rev>0||bp.cost>0) && (
                <div key={p.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0", color:"#475569" }}>
                  <span>{p.emoji} {p.name}</span>
                  <span>
                    <span style={{ color:"#16a34a" }}>S/{fmt(bp.rev)}</span>
                    <span style={{ color:"#94a3b8" }}> − S/{fmt(bp.cost)}</span>
                    {bp.merma>0 && <span style={{ color:"#f97316" }}> − 🗑️S/{fmt(bp.merma)}</span>}
                    <span style={{ color:"#94a3b8" }}> = </span>
                    <strong style={{ color:bp.margin>=0?"#16a34a":"#dc2626" }}>S/{fmt(bp.margin)}</strong>
                  </span>
                </div>
              );
            })}
            <div style={{ borderTop:"1px dashed #cbd5e1", margin:"8px 0" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", padding:"2px 0" }}>
              <span>💸 Gastos operativos</span><span>− S/{fmt(tots.opTotal)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", padding:"2px 0" }}>
              <span>🏠 Fijos del día</span><span>− S/{fmt(tots.fpd)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:900, fontSize:20, marginTop:10, paddingTop:10, borderTop:`1px solid ${col.br}40`, color:col.bg }}>
              <span>💰 Ganancia neta</span><span>S/ {fmt(tots.net)}</span>
            </div>
            {n(cfg.objetivo)>0 && (
              <div style={{ fontSize:11, color:"#64748b", marginTop:4, textAlign:"right" }}>
                Meta: S/{cfg.objetivo} {tots.net>=n(cfg.objetivo) ? "✅" : `· faltan S/${fmt(Math.max(0,n(cfg.objetivo)-tots.net))}`}
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ display:"flex", gap:8 }}>
        {onCancel && <Btn label="↩️ Cancelar" color="#64748b" outline onClick={onCancel} full/>}
        <Btn label={isEdit ? "💾 Guardar cambios" : "✅ Guardar día"} onClick={() => onSave(d)} full/>
      </div>
    </div>
  );
}