// Formularios de configuración: costos, ingredientes y platos
import { useState, useMemo } from 'react';
import { Field, Btn, G2 } from './ui.jsx';
import { n, fmt, uid, uCost } from '../utils.js';
import { PCOLORS, UNITS } from '../defaults.js';

// ── Costo fijo o gasto operativo ─────────────────────────────
export function CostForm({ initial, isOp, onSave, onClose }) {
  const [f, setF] = useState(initial || { name:"", amount:"", defaultAmount:"" });
  const sf = (k, v) => setF(x => ({ ...x, [k]:v }));
  return (
    <div>
      <Field label="📝 Nombre del costo" value={f.name} onChange={v=>sf("name",v)} type="text" placeholder="ej. Alquiler, Gas, Personal..." />
      {isOp
        ? <Field label="💲 Monto por defecto/día (S/)" value={f.defaultAmount} onChange={v=>sf("defaultAmount",v)} note="Puedes modificarlo en el registro de cada día" />
        : <Field label="💲 Monto mensual (S/)"          value={f.amount}        onChange={v=>sf("amount",v)} />
      }
      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <Btn label="Cancelar" color="#64748b" outline onClick={onClose} full />
        <Btn label={initial ? "💾 Guardar" : "➕ Agregar"} onClick={() => {
          if (!f.name.trim()) return;
          onSave({ ...f, id:f.id||uid(), amount:n(f.amount), defaultAmount:n(f.defaultAmount) });
        }} full />
      </div>
    </div>
  );
}

// ── Ingrediente ───────────────────────────────────────────────
export function IngForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || { name:"", unit:"kg", price:"" });
  const sf = (k, v) => setF(x => ({ ...x, [k]:v }));
  return (
    <div>
      <Field label="📦 Nombre" value={f.name} onChange={v=>sf("name",v)} type="text" placeholder="ej. Arroz, Pollo..." />
      <div style={{ marginBottom:8 }}>
        <label style={{ fontSize:11, color:"#64748b", fontWeight:700, display:"block", marginBottom:3 }}>📐 Unidad de medida</label>
        <select value={f.unit} onChange={e=>sf("unit",e.target.value)} style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:10, padding:"8px 12px", fontSize:14, background:"#f8fafc" }}>
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </div>
      <Field label={`💲 Precio por ${f.unit} (S/)`} value={f.price} onChange={v=>sf("price",v)} />
      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <Btn label="Cancelar" color="#64748b" outline onClick={onClose} full />
        <Btn label={initial ? "💾 Guardar" : "➕ Agregar"} onClick={() => {
          if (!f.name.trim()) return;
          onSave({ ...f, price:n(f.price), id:f.id||uid() });
        }} full />
      </div>
    </div>
  );
}

// ── Plato (con receta) ────────────────────────────────────────
export function ProdForm({ initial, ings, onSave, onClose }) {
  const [f, setF] = useState(initial || { name:"", emoji:"🍽️", color:PCOLORS[0], price:"", mode:"units", loteSize:1, recipe:[] });
  const sf  = (k, v) => setF(x => ({ ...x, [k]:v }));
  const addRI   = () => { const i=ings[0]; if(!i) return; setF(x=>({...x,recipe:[...x.recipe,{id:uid(),ingId:i.id,qty:""}]})); };
  const updRI   = (rid,k,v) => setF(x=>({...x,recipe:x.recipe.map(r=>r.id===rid?{...r,[k]:v}:r)}));
  const remRI   = rid => setF(x=>({...x,recipe:x.recipe.filter(r=>r.id!==rid)}));

  const batchCost = useMemo(() => f.recipe.reduce((s,it)=>{
    const ing=ings.find(i=>i.id===it.ingId); return s+(ing?n(it.qty)*n(ing.price):0);
  },0),[f,ings]);
  const perUnit = n(f.loteSize)>1 ? batchCost/n(f.loteSize) : batchCost;
  const margin  = n(f.price)>0 ? ((n(f.price)-perUnit)/n(f.price)*100) : 0;

  return (
    <div>
      <G2>
        <div>
          <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:3}}>🎨 Emoji</label>
          <input value={f.emoji} onChange={e=>sf("emoji",e.target.value)}
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px",fontSize:22,textAlign:"center",background:"#f8fafc",boxSizing:"border-box"}}/>
        </div>
        <Field label="🍽️ Nombre del plato" value={f.name} onChange={v=>sf("name",v)} type="text" placeholder="ej. Juane"/>
      </G2>

      <div style={{marginBottom:10}}>
        <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:6}}>🎨 Color</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {PCOLORS.map(c=>(
            <button key={c} onClick={()=>sf("color",c)}
              style={{width:30,height:30,borderRadius:"50%",background:c,border:f.color===c?"3px solid #1e293b":"2px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
      </div>

      <G2>
        <Field label="💰 Precio de venta (S/)" value={f.price} onChange={v=>sf("price",v)}/>
        <div>
          <label style={{fontSize:11,color:"#64748b",fontWeight:700,display:"block",marginBottom:4}}>📊 Modo de registro</label>
          <div style={{display:"flex",gap:4}}>
            {[["units","📦 Unidades"],["direct","💵 Caja directa"]].map(([v,l])=>(
              <button key={v} onClick={()=>sf("mode",v)}
                style={{flex:1,padding:"7px 4px",borderRadius:10,border:`2px solid ${f.mode===v?"#2563eb":"#e2e8f0"}`,background:f.mode===v?"#eff6ff":"#f8fafc",color:f.mode===v?"#2563eb":"#64748b",fontSize:11,fontWeight:700,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
          <p style={{fontSize:10,color:"#94a3b8",marginTop:3}}>{f.mode==="units"?"Ingresas cuántos vendiste":"Ingresas el total de caja"}</p>
        </div>
      </G2>

      {/* Receta */}
      <div style={{background:"#f8fafc",borderRadius:12,padding:12,marginBottom:8,border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <span style={{fontSize:12,fontWeight:800,color:"#334155"}}>🧾 Receta</span>
            <p style={{fontSize:10,color:"#94a3b8",margin:"2px 0 0"}}>Cantidades <strong>por lote</strong>. Si preparas 27 juanes a la vez, eso es 1 lote de 27.</p>
          </div>
          <Btn label="+ Ingrediente" small onClick={addRI}/>
        </div>

        <Field label="📦 Unidades por lote" value={f.loteSize} onChange={v=>sf("loteSize",n(v))}
          note={f.loteSize>1?`1 lote = ${f.loteSize} unidades`:"1 = receta por plato individual"}/>

        {f.recipe.length===0 && (
          <p style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"8px 0"}}>Sin ingredientes. Agrega para calcular el costo.</p>
        )}

        {f.recipe.map(ri => {
          const ing=ings.find(i=>i.id===ri.ingId);
          const riCost=ing?n(ri.qty)*n(ing.price):0;
          return (
            <div key={ri.id} style={{background:"#fff",borderRadius:10,padding:"8px 10px",marginBottom:6,border:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                <select value={ri.ingId} onChange={e=>updRI(ri.id,"ingId",e.target.value)}
                  style={{flex:1,border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 8px",fontSize:12,background:"#f8fafc"}}>
                  {ings.map(i=><option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
                <input type="number" value={ri.qty} onChange={e=>updRI(ri.id,"qty",e.target.value)}
                  style={{width:65,border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 8px",fontSize:12}} placeholder="cant."/>
                <span style={{fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>{ing?.unit}</span>
                <button onClick={()=>remRI(ri.id)}
                  style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontWeight:700}}>✕</button>
              </div>
              <div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>
                {ri.qty} {ing?.unit} × S/{fmt(ing?.price||0)} = <strong>S/{fmt(riCost)}</strong> por lote
              </div>
            </div>
          );
        })}

        {batchCost>0 && (
          <div style={{background:margin>30?"#dcfce7":margin>0?"#fef9c3":"#fee2e2",borderRadius:10,padding:"10px 12px",marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700}}>
              <span>🧾 Costo del lote ({f.loteSize} und)</span><span>S/ {fmt(batchCost)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginTop:3}}>
              <span>💲 Costo por unidad</span><span>S/ {fmt(perUnit)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:800,marginTop:6,borderTop:"1px solid rgba(0,0,0,0.1)",paddingTop:6,color:margin>30?"#16a34a":margin>0?"#d97706":"#dc2626"}}>
              <span>📊 Margen por unidad</span><span>{margin.toFixed(0)}% · S/{fmt(n(f.price)-perUnit)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8,marginTop:8}}>
        <Btn label="Cancelar" color="#64748b" outline onClick={onClose} full/>
        <Btn label={initial?"💾 Guardar":"➕ Agregar plato"} onClick={()=>{
          if(!f.name.trim()) return;
          onSave({...f,price:n(f.price),loteSize:n(f.loteSize)||1,id:f.id||uid()});
        }} full/>
      </div>
    </div>
  );
}