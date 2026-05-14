import { useState, useMemo, useEffect, useRef } from "react";
import { D_CFG, D_INGS, D_PRODS } from "./defaults.js";
import { n, fmt, uid, uCost, fDate } from "./utils.js";
import {
	TC,
	Toast,
	Modal,
	Btn,
	Field,
	CardHead,
} from "./components/ui.jsx";
import { CostForm, IngForm, ProdForm } from "./components/forms.jsx";
import DayForm from "./components/DayForm.jsx";
import { DayDetail } from "./components/DayDetail.jsx";
import { Calendar } from "./components/Calendar.jsx";
import Analysis from "./components/Analysis.jsx";
import Logo from "./components/Logo.jsx";

const TABS = [
	{ i: "⚙️", l: "Config" },
	{ i: "📝", l: "Día" },
	{ i: "📅", l: "Historial" },
	{ i: "📊", l: "Análisis" },
];

export default function App() {
	// ── Estado principal ────────────────────────────────────────
	const [tab, setTab] = useState(0);
	const [cfg, setCfg] = useState(D_CFG);
	const [ings, setIngs] = useState(D_INGS);
	const [prods, setProds] = useState(D_PRODS);
	const [log, setLog] = useState([]);
	const [editRec, setEditRec] = useState(null);
	const [selDate, setSelDate] = useState(null);
	const [modal, setModal] = useState(null); // { type, data }
	const [toast, setToast] = useState("");
	const [backupMode, setBackupMode] = useState(null); // null | "export" | "import"
	const iCfgRef = useRef();
	const iLogRef = useRef();

	// ── Persistencia localStorage ───────────────────────────────
	useEffect(() => {
		try {
			const sc = localStorage.getItem("rc3"),
				si = localStorage.getItem("ri3"),
				sp = localStorage.getItem("rp3"),
				sl = localStorage.getItem("rl3");
			if (sc) setCfg(JSON.parse(sc));
			if (si) setIngs(JSON.parse(si));
			if (sp) setProds(JSON.parse(sp));
			if (sl) setLog(JSON.parse(sl));
		} catch (e) {}
	}, []);
	useEffect(() => {
		try {
			localStorage.setItem("rc3", JSON.stringify(cfg));
		} catch (e) {}
	}, [cfg]);
	useEffect(() => {
		try {
			localStorage.setItem("ri3", JSON.stringify(ings));
		} catch (e) {}
	}, [ings]);
	useEffect(() => {
		try {
			localStorage.setItem("rp3", JSON.stringify(prods));
		} catch (e) {}
	}, [prods]);
	useEffect(() => {
		try {
			localStorage.setItem("rl3", JSON.stringify(log));
		} catch (e) {}
	}, [log]);

	// ── Helpers ─────────────────────────────────────────────────
	const st = (msg) => {
		setToast(msg);
		setTimeout(() => setToast(""), 2500);
	};


	// Helpers para listas dinámicas en cfg
	const updList = (key, item) =>
		setCfg((c) => ({
			...c,
			[key]: c[key].map((x) => (x.id === item.id ? item : x)),
		}));
	const addList = (key, item) =>
		setCfg((c) => ({ ...c, [key]: [...c[key], item] }));
	const delList = (key, id) =>
		setCfg((c) => ({ ...c, [key]: c[key].filter((x) => x.id !== id) }));

	// ── Export / Import ─────────────────────────────────────────
	const dl = (data, name) => {
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${name}_${new Date().toISOString().split("T")[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const exportCfg = () => {
		dl({ version: 3, cfg, ingredients: ings, products: prods }, "config");
		st("✅ Configuración exportada");
	};
	const exportLog = () => {
		dl({ version: 3, log }, "ventas");
		st("✅ Ventas exportadas");
	};

	const importCfg = (e) => {
		const f = e.target.files[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = (ev) => {
			try {
				const d = JSON.parse(ev.target.result);
				if (d.cfg) setCfg({ ...D_CFG, ...d.cfg });
				if (d.ingredients) setIngs(d.ingredients);
				if (d.products) setProds(d.products);
				st("✅ Configuración importada");
			} catch { st("❌ Error al leer"); }
		};
		r.readAsText(f);
		e.target.value = "";
	};
	const importLog = (e) => {
		const f = e.target.files[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = (ev) => {
			try {
				const d = JSON.parse(ev.target.result);
				if (d.log) setLog(d.log);
				st("✅ Ventas importadas");
			} catch { st("❌ Error al leer"); }
		};
		r.readAsText(f);
		e.target.value = "";
	};

	// ── Handlers de días ────────────────────────────────────────
	const saveDay = (rec) => {
		setLog((l) => [rec, ...l.filter((r) => r.fecha !== rec.fecha)]);
		setEditRec(null);
		st("✅ Guardado");
		setTab(2);
	};
	const delDay = (fecha) => {
		setLog((l) => l.filter((r) => r.fecha !== fecha));
		setSelDate(null);
		st("🗑️ Eliminado");
	};
	const logMap = useMemo(() => {
		const m = {};
		log.forEach((r) => {
			m[r.fecha] = r;
		});
		return m;
	}, [log]);

	// ── Títulos de modales ──────────────────────────────────────
	const modalTitle = {
		ingredient: modal?.data ? "✏️ Editar ingrediente" : "➕ Nuevo ingrediente",
		product: modal?.data ? "✏️ Editar plato" : "➕ Nuevo plato",
		fixedCost: modal?.data ? "✏️ Editar costo fijo" : "➕ Nuevo costo fijo",
		opCost: modal?.data
			? "✏️ Editar gasto operativo"
			: "➕ Nuevo gasto operativo",
	};

	// ── Render ───────────────────────────────────────────────────
	return (
		<div
			style={{
				maxWidth: 480,
				margin: "0 auto",
				fontFamily: "system-ui,-apple-system,sans-serif",
				background: "#f1f5f9",
				minHeight: "100vh",
			}}>
			<Toast msg={toast} />

			{/* Modal */}
			{modal && (
				<Modal
					title={modalTitle[modal.type] || ""}
					onClose={() => setModal(null)}>
					{(modal.type === "fixedCost" || modal.type === "opCost") && (
						<CostForm
							initial={modal.data}
							isOp={modal.type === "opCost"}
							onClose={() => setModal(null)}
							onSave={(item) => {
								const key = modal.type === "opCost" ? "opCosts" : "fixedCosts";
								modal.data ? updList(key, item) : addList(key, item);
								setModal(null);
								st("✅ Guardado");
							}}
						/>
					)}
					{modal.type === "ingredient" && (
						<IngForm
							initial={modal.data}
							onClose={() => setModal(null)}
							onSave={(ing) => {
								modal.data
									? setIngs((x) => x.map((i) => (i.id === ing.id ? ing : i)))
									: setIngs((x) => [...x, ing]);
								setModal(null);
								st("✅ Guardado");
							}}
						/>
					)}
					{modal.type === "product" && (
						<ProdForm
							initial={modal.data}
							ings={ings}
							onClose={() => setModal(null)}
							onSave={(p) => {
								modal.data
									? setProds((x) => x.map((pp) => (pp.id === p.id ? p : pp)))
									: setProds((x) => [...x, p]);
								setModal(null);
								st("✅ Guardado");
							}}
						/>
					)}
				</Modal>
			)}

			{/* Modal backup */}
			{backupMode && (
				<Modal
					title={backupMode === "export" ? "⬇️ ¿Qué querés exportar?" : "⬆️ ¿Qué querés importar?"}
					onClose={() => setBackupMode(null)}>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						{[
							{ label: "⚙️ Configuración", sub: "Costos, ingredientes y platos", onAct: () => backupMode === "export" ? exportCfg() : iCfgRef.current.click() },
							{ label: "💰 Ventas", sub: "Historial de días registrados", onAct: () => backupMode === "export" ? exportLog() : iLogRef.current.click() },
						].map(({ label, sub, onAct }) => (
							<button key={label} onClick={() => { onAct(); setBackupMode(null); }}
								style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
								<span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{label}</span>
								<span style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</span>
							</button>
						))}
					</div>
				</Modal>
			)}

			{/* Header sticky */}
			<div
				style={{
					background: "linear-gradient(135deg,#1e293b,#0f172a)",
					padding: "18px 16px 12px",
					position: "sticky",
					top: 0,
					zIndex: 100,
					boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
				}}>
				<div style={{ textAlign: "center", marginBottom: 12 }}>
					<div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
						<Logo size={30} />
					</div>
					<h1
						style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>
						Restbox
					</h1>
				</div>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(4,1fr)",
						gap: 4,
						background: "rgba(255,255,255,0.08)",
						padding: 4,
						borderRadius: 14,
					}}>
					{TABS.map(({ i, l }, idx) => (
						<button
							key={idx}
							onClick={() => setTab(idx)}
							style={{
								textAlign: "center",
								padding: "7px 2px",
								borderRadius: 10,
								border: "none",
								cursor: "pointer",
								background: tab === idx ? "#fff" : "transparent",
								boxShadow: tab === idx ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
								color: tab === idx ? "#1e293b" : "rgba(255,255,255,0.6)",
								fontWeight: tab === idx ? 800 : 500,
								transition: "all 0.15s",
							}}>
							<div style={{ fontSize: 17, lineHeight: 1.2 }}>{i}</div>
							<div style={{ fontSize: 9, lineHeight: 1.4 }}>{l}</div>
						</button>
					))}
				</div>
			</div>

			<div style={{ padding: "12px 12px 40px" }}>
				<input ref={iCfgRef} type="file" accept=".json" onChange={importCfg} style={{ display: "none" }} />
				<input ref={iLogRef} type="file" accept=".json" onChange={importLog} style={{ display: "none" }} />

				{/* ── CONFIG ─────────────────────────────────────────── */}
				{tab === 0 && (
					<div>
						{/* Backup */}
						<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
							<button onClick={() => setBackupMode("export")} style={{ flex: 1, background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
								⬇️ Exportar
							</button>
							<button onClick={() => setBackupMode("import")} style={{ flex: 1, background: "#fff", color: "#1e293b", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "11px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
								⬆️ Importar
							</button>
						</div>
						{/* General */}
						<div style={{ ...TC.card, padding: 0 }}>
							<CardHead
								icon="⚙️"
								title="Configuración general"
								color="gray"
							/>
							<div style={{ padding: 14 }}>
								<Field
									label="🎯 Meta ganancia operativa/día (S/)"
									value={cfg.objetivo}
									onChange={(v) => setCfg((c) => ({ ...c, objetivo: n(v) }))}
								/>
							</div>
						</div>

						{/* Costos fijos */}
						<div style={{ ...TC.card, padding: 0 }}>
							<CardHead
								icon="🏠"
								title={`Costos fijos mensuales (${cfg.fixedCosts?.length || 0})`}
								color="red"
								right={
									<Btn
										label="+ Agregar"
										small
										onClick={() => setModal({ type: "fixedCost", data: null })}
									/>
								}
							/>
							<div style={{ padding: 10 }}>
								{(cfg.fixedCosts || []).map((f) => (
									<div
										key={f.id}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											padding: "6px 8px",
											borderRadius: 8,
											marginBottom: 4,
											background: "#fef2f2",
										}}>
										<div>
											<span style={{ fontSize: 13, fontWeight: 600 }}>
												{f.name}
											</span>
											<span
												style={{
													fontSize: 11,
													color: "#94a3b8",
													marginLeft: 6,
												}}>
												S/{fmt(f.amount)}/mes
											</span>
										</div>
										<div style={{ display: "flex", gap: 4 }}>
											<button
												onClick={() => setModal({ type: "fixedCost", data: f })}
												style={{
													background: "#eff6ff",
													color: "#2563eb",
													border: "none",
													borderRadius: 8,
													padding: "4px 8px",
													cursor: "pointer",
													fontSize: 11,
													fontWeight: 700,
												}}>
												✏️
											</button>
											<button
												onClick={() => delList("fixedCosts", f.id)}
												style={{
													background: "#fee2e2",
													color: "#dc2626",
													border: "none",
													borderRadius: 8,
													padding: "4px 8px",
													cursor: "pointer",
													fontSize: 11,
													fontWeight: 700,
												}}>
												🗑️
											</button>
										</div>
									</div>
								))}
								<div
									style={{
										background: "#fee2e2",
										borderRadius: 8,
										padding: "6px 10px",
										marginTop: 6,
										fontSize: 11,
										color: "#991b1b",
										fontWeight: 700,
									}}>
									💡 Total: S/
									{fmt(
										(cfg.fixedCosts || []).reduce((s, f) => s + n(f.amount), 0),
									)}
									/mes · S/{fmt(fixedDay)}/día
								</div>
							</div>
						</div>

						{/* Gastos operativos */}
						<div style={{ ...TC.card, padding: 0 }}>
							<CardHead
								icon="💸"
								title={`Gastos operativos diarios (${cfg.opCosts?.length || 0})`}
								color="blue"
								right={
									<Btn
										label="+ Agregar"
										small
										onClick={() => setModal({ type: "opCost", data: null })}
									/>
								}
							/>
							<div style={{ padding: 10 }}>
								{(cfg.opCosts || []).map((oc) => (
									<div
										key={oc.id}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											padding: "6px 8px",
											borderRadius: 8,
											marginBottom: 4,
											background: "#eff6ff",
										}}>
										<div>
											<span style={{ fontSize: 13, fontWeight: 600 }}>
												{oc.name}
											</span>
											<span
												style={{
													fontSize: 11,
													color: "#94a3b8",
													marginLeft: 6,
												}}>
												S/{fmt(oc.defaultAmount)}/día por defecto
											</span>
										</div>
										<div style={{ display: "flex", gap: 4 }}>
											<button
												onClick={() => setModal({ type: "opCost", data: oc })}
												style={{
													background: "#eff6ff",
													color: "#2563eb",
													border: "none",
													borderRadius: 8,
													padding: "4px 8px",
													cursor: "pointer",
													fontSize: 11,
													fontWeight: 700,
												}}>
												✏️
											</button>
											<button
												onClick={() => delList("opCosts", oc.id)}
												style={{
													background: "#fee2e2",
													color: "#dc2626",
													border: "none",
													borderRadius: 8,
													padding: "4px 8px",
													cursor: "pointer",
													fontSize: 11,
													fontWeight: 700,
												}}>
												🗑️
											</button>
										</div>
									</div>
								))}
								<p
									style={{
										fontSize: 11,
										color: "#64748b",
										marginTop: 6,
										marginBottom: 0,
									}}>
									💡 Puedes modificar cada valor en el registro diario.
								</p>
							</div>
						</div>

						{/* Ingredientes */}
						<div style={{ ...TC.card, padding: 0 }}>
							<CardHead
								icon="📦"
								title={`Ingredientes (${ings.length})`}
								color="yellow"
								right={
									<Btn
										label="+ Nuevo"
										small
										onClick={() => setModal({ type: "ingredient", data: null })}
									/>
								}
							/>
							<div style={{ padding: 10, maxHeight: 280, overflowY: "auto" }}>
								{ings.map((ing) => (
									<div
										key={ing.id}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											padding: "5px 8px",
											borderRadius: 8,
											marginBottom: 3,
											background: "#f8fafc",
										}}>
										<div>
											<span style={{ fontSize: 13, fontWeight: 600 }}>
												{ing.name}
											</span>
											<span
												style={{
													fontSize: 11,
													color: "#94a3b8",
													marginLeft: 6,
												}}>
												S/{fmt(ing.price)}/{ing.unit}
											</span>
										</div>
										<div style={{ display: "flex", gap: 4 }}>
											<button
												onClick={() =>
													setModal({ type: "ingredient", data: ing })
												}
												style={{
													background: "#eff6ff",
													color: "#2563eb",
													border: "none",
													borderRadius: 8,
													padding: "4px 8px",
													cursor: "pointer",
													fontSize: 11,
												}}>
												✏️
											</button>
											<button
												onClick={() =>
													setIngs((x) => x.filter((i) => i.id !== ing.id))
												}
												style={{
													background: "#fee2e2",
													color: "#dc2626",
													border: "none",
													borderRadius: 8,
													padding: "4px 8px",
													cursor: "pointer",
													fontSize: 11,
												}}>
												🗑️
											</button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Platos */}
						<div style={{ ...TC.card, padding: 0 }}>
							<CardHead
								icon="🍽️"
								title={`Platos (${prods.length})`}
								color="green"
								right={
									<Btn
										label="+ Nuevo plato"
										small
										onClick={() => setModal({ type: "product", data: null })}
									/>
								}
							/>
							<div style={{ padding: 10 }}>
								{prods.map((p) => {
									const uc = uCost(p, ings);
									const bCost = uc * (n(p.loteSize) || 1);
									const margin =
										n(p.price) > 0 && uc > 0
											? ((n(p.price) - uc) / n(p.price)) * 100
											: null;
									return (
										<div
											key={p.id}
											style={{
												background: "#f8fafc",
												borderRadius: 12,
												padding: "10px 12px",
												marginBottom: 8,
												border: `1.5px solid ${p.color}25`,
											}}>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
												}}>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: 8,
													}}>
													<span style={{ fontSize: 22 }}>{p.emoji}</span>
													<div>
														<span style={{ fontSize: 14, fontWeight: 700 }}>
															{p.name}
														</span>
														<span
															style={{
																fontSize: 11,
																color: "#94a3b8",
																marginLeft: 6,
															}}>
															S/{fmt(n(p.price))}
														</span>
														{p.loteSize > 1 && (
															<span
																style={{
																	fontSize: 10,
																	background: `${p.color}20`,
																	color: p.color,
																	borderRadius: 999,
																	padding: "2px 6px",
																	marginLeft: 6,
																	fontWeight: 600,
																}}>
																lote {p.loteSize}
															</span>
														)}
														<span
															style={{
																fontSize: 10,
																background: "#f1f5f9",
																color: "#64748b",
																borderRadius: 999,
																padding: "2px 6px",
																marginLeft: 4,
																fontWeight: 600,
															}}>
															{p.mode === "units" ? "📦 und" : "💵 caja"}
														</span>
													</div>
												</div>
												<div style={{ display: "flex", gap: 4 }}>
													<button
														onClick={() =>
															setModal({ type: "product", data: p })
														}
														style={{
															background: "#eff6ff",
															color: "#2563eb",
															border: "none",
															borderRadius: 8,
															padding: "4px 8px",
															cursor: "pointer",
															fontSize: 11,
														}}>
														✏️
													</button>
													<button
														onClick={() =>
															setProds((x) => x.filter((pp) => pp.id !== p.id))
														}
														style={{
															background: "#fee2e2",
															color: "#dc2626",
															border: "none",
															borderRadius: 8,
															padding: "4px 8px",
															cursor: "pointer",
															fontSize: 11,
														}}>
														🗑️
													</button>
												</div>
											</div>
											{p.recipe.length > 0 && margin != null && (
												<div style={{ marginTop: 8 }}>
													<div
														style={{
															background: "#e2e8f0",
															borderRadius: 999,
															height: 5,
															overflow: "hidden",
														}}>
														<div
															style={{
																width: `${Math.min(margin, 100)}%`,
																background:
																	margin > 40
																		? "#16a34a"
																		: margin > 20
																			? "#d97706"
																			: "#dc2626",
																height: 5,
																borderRadius: 999,
															}}
														/>
													</div>
													<div
														style={{
															display: "flex",
															justifyContent: "space-between",
															fontSize: 10,
															color: "#64748b",
															marginTop: 3,
														}}>
														<span>
															Costo: S/{fmt(uc)}/und
															{p.loteSize > 1 ? ` (S/${fmt(bCost)}/lote)` : ""}
														</span>
														<span>
															Margen:{" "}
															<strong
																style={{
																	color:
																		margin > 40
																			? "#16a34a"
																			: margin > 20
																				? "#d97706"
																				: "#dc2626",
																}}>
																{margin.toFixed(0)}%
															</strong>
														</span>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					</div>
				)}

				{/* ── DÍA ──────────────────────────────────────────── */}
				{tab === 1 &&
					(editRec ? (
						<DayForm
							initial={editRec}
							prods={prods}
							ings={ings}
							cfg={cfg}
							onSave={saveDay}
							onCancel={() => setEditRec(null)}
							isEdit
						/>
					) : (
						<DayForm
							prods={prods}
							ings={ings}
							cfg={cfg}
							onSave={saveDay}
						/>
					))}

				{/* ── HISTORIAL ────────────────────────────────────── */}
				{tab === 2 && (
					<div>
						<Calendar
							log={log}
							prods={prods}
							ings={ings}
							cfg={cfg}
							onSelect={setSelDate}
							selected={selDate}
						/>
						{selDate && logMap[selDate] && (
							<DayDetail
								rec={logMap[selDate]}
								prods={prods}
								ings={ings}
								cfg={cfg}
								onEdit={() => {
									setEditRec(logMap[selDate]);
									setTab(1);
									setSelDate(null);
								}}
								onDelete={() => delDay(selDate)}
								onClose={() => setSelDate(null)}
							/>
						)}
						{selDate && !logMap[selDate] && (
							<div style={{ ...TC.card, padding: 24, textAlign: "center" }}>
								<div style={{ fontSize: 36, marginBottom: 6 }}>📭</div>
								<p
									style={{
										fontSize: 13,
										color: "#64748b",
										fontWeight: 600,
										margin: "0 0 12px",
									}}>
									Sin registro para {fDate(selDate)}
								</p>
								<Btn
									label="📝 Registrar este día"
									onClick={() => {
										setEditRec({
											fecha: selDate,
											status: "open",
											entries: {},
											opCosts: {},
										});
										setTab(1);
										setSelDate(null);
									}}
								/>
							</div>
						)}
						{!selDate && (
							<p
								style={{
									textAlign: "center",
									fontSize: 12,
									color: "#94a3b8",
									padding: "6px 0",
								}}>
								☝️ Toca un día registrado para ver el detalle
							</p>
						)}
					</div>
				)}

				{/* ── ANÁLISIS ─────────────────────────────────────── */}
				{tab === 3 && (
					<Analysis
						log={log}
						prods={prods}
						ings={ings}
						cfg={cfg}
					/>
				)}
			</div>
		</div>
	);
}
