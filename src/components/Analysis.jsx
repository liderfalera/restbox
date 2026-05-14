import { useMemo, useState } from "react";
import { WDAYS_L } from "../defaults.js";
import { dTotals, n, fmt } from "../utils.js";
import { TC, CardHead } from "./ui.jsx";

const inputStyle = {
	border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 10px",
	fontSize: 13, background: "#f8fafc", width: "100%", boxSizing: "border-box",
};

export default function Analysis({ log, prods, ings, cfg }) {
	const [desde, setDesde] = useState("");
	const [hasta, setHasta] = useState("");

	const openLog = useMemo(() => {
		return log.filter((r) => {
			if (r.status === "closed") return false;
			if (desde && r.fecha < desde) return false;
			if (hasta && r.fecha > hasta) return false;
			return true;
		});
	}, [log, desde, hasta]);

	const tots = useMemo(
		() => openLog.map((r) => dTotals(r, prods, ings, cfg)),
		[openLog, prods, ings, cfg],
	);

	const prodStats = useMemo(
		() =>
			prods.map((p) => {
				let tRev = 0,
					tCost = 0,
					tMerma = 0,
					days = 0,
					tUnits = 0;
				tots.forEach((t, idx) => {
					const bp = t.byP[p.id];
					if (bp && (bp.rev > 0 || bp.cost > 0)) {
						tRev += bp.rev;
						tCost += bp.cost;
						tMerma += bp.merma;
						days++;
					}
					if (p.mode === "units") {
						const e = openLog[idx]?.entries[p.id];
						if (e) tUnits += n(e.sold);
					}
				});
				return {
					...p,
					tRev,
					tCost,
					tMerma,
					tMargin: tRev - tCost - tMerma,
					days,
					tUnits,
					avgDay: days > 0 ? (tRev - tCost - tMerma) / days : 0,
				};
			}),
		[prods, tots, openLog],
	);

	const dowStats = useMemo(
		() =>
			WDAYS_L.map((name, i) => {
				const days = tots.filter(
					(_, idx) => new Date(openLog[idx].fecha).getDay() === i,
				);
				return {
					name,
					avg: days.length
						? days.reduce((s, t) => s + t.net, 0) / days.length
						: null,
					count: days.length,
				};
			}),
		[tots, openLog],
	);

	const overall = useMemo(() => {
		if (!tots.length) return null;
		const nets = tots.map((t) => t.net);
		const tMerma = tots.reduce((s, t) => s + t.mermaTotal, 0);
		return {
			total: nets.reduce((a, b) => a + b, 0),
			avg: nets.reduce((a, b) => a + b, 0) / nets.length,
			best: Math.max(...nets),
			worst: Math.min(...nets),
			open: openLog.length,
			closed: log.filter((r) => r.status === "closed").length,
			tMerma,
		};
	}, [tots, openLog, log]);

	if (!log.length)
		return (
			<div style={{ ...TC.card, padding: 40, textAlign: "center" }}>
				<div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
				<div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>
					Sin datos aún
				</div>
				<p style={{ fontSize: 12, color: "#cbd5e1" }}>
					Registra días en 📝 para ver el análisis
				</p>
			</div>
		);

	return (
		<div>
			{/* Filtro de fechas */}
			<div style={{ ...TC.card, padding: 12 }}>
				<p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 8px" }}>
					🗓️ Filtrar período
				</p>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
					<div>
						<label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 3 }}>DESDE</label>
						<input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={inputStyle} />
					</div>
					<div>
						<label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 3 }}>HASTA</label>
						<input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={inputStyle} />
					</div>
				</div>
				{(desde || hasta) && (
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
						<span style={{ fontSize: 11, color: "#64748b" }}>
							{openLog.length} día{openLog.length !== 1 ? "s" : ""} en el período
						</span>
						<button onClick={() => { setDesde(""); setHasta(""); }}
							style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
							Limpiar filtro
						</button>
					</div>
				)}
			</div>

			{/* Sin resultados para el filtro aplicado */}
			{!openLog.length && (
				<div style={{ ...TC.card, padding: 32, textAlign: "center" }}>
					<div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
					<p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, margin: 0 }}>
						Sin registros en ese período
					</p>
				</div>
			)}

			{/* Tarjetas resumen */}
			{overall && (
				<>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 8,
							marginBottom: 8,
						}}>
						{[
							[
								"💰",
								overall.total >= 0 ? "#16a34a" : "#dc2626",
								"Acumulado",
								"S/ " + fmt(overall.total),
							],
							["📊", "#2563eb", "Promedio/día", "S/ " + fmt(overall.avg)],
							["🏆", "#16a34a", "Mejor día", "S/ " + fmt(overall.best)],
							["📉", "#dc2626", "Peor día", "S/ " + fmt(overall.worst)],
						].map(([icon, color, label, value]) => (
							<div
								key={label}
								style={{
									background: `${color}12`,
									border: `1px solid ${color}25`,
									borderRadius: 14,
									padding: "12px 14px",
								}}>
								<div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
								<div
									style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>
									{label}
								</div>
								<div style={{ fontSize: 16, fontWeight: 800, color }}>
									{value}
								</div>
							</div>
						))}
					</div>
					{overall.tMerma > 0 && (
						<div
							style={{
								background: "#fff7ed",
								border: "1px solid #fed7aa",
								borderRadius: 12,
								padding: "10px 14px",
								marginBottom: 12,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}>
							<span style={{ fontSize: 13, color: "#9a3412", fontWeight: 700 }}>
								🗑️ Merma total acumulada
							</span>
							<span style={{ fontSize: 16, fontWeight: 800, color: "#ea580c" }}>
								S/ {fmt(overall.tMerma)}
							</span>
						</div>
					)}
				</>
			)}

			{/* Rendimiento por plato */}
			<div style={{ ...TC.card, padding: 0 }}>
				<CardHead
					icon="📦"
					title="Rendimiento por plato"
					color="green"
				/>
				<div style={{ padding: 14 }}>
					{prodStats.map((p) => {
						if (!p.days) return null;
						const pct = p.tRev > 0 ? (p.tMargin / p.tRev) * 100 : 0;
						const barC =
							pct > 40 ? "#16a34a" : pct > 20 ? "#d97706" : "#dc2626";
						return (
							<div
								key={p.id}
								style={{
									marginBottom: 14,
									paddingBottom: 14,
									borderBottom: "1px solid #f1f5f9",
								}}>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: 6,
									}}>
									<div
										style={{ display: "flex", alignItems: "center", gap: 8 }}>
										<span style={{ fontSize: 20 }}>{p.emoji}</span>
										<div>
											<span style={{ fontSize: 13, fontWeight: 700 }}>
												{p.name}
											</span>
											<span
												style={{
													fontSize: 11,
													color: "#94a3b8",
													marginLeft: 6,
												}}>
												{p.days} días · {p.tUnits > 0 ? p.tUnits + " und" : ""}
											</span>
										</div>
									</div>
									<div style={{ textAlign: "right" }}>
										<div
											style={{
												fontSize: 12,
												color: "#16a34a",
												fontWeight: 600,
											}}>
											S/{fmt(p.tRev)} ingresos
										</div>
										{p.tMerma > 0 && (
											<div style={{ fontSize: 11, color: "#f97316" }}>
												🗑️ S/{fmt(p.tMerma)} merma
											</div>
										)}
									</div>
								</div>
								<div
									style={{
										background: "#f1f5f9",
										borderRadius: 999,
										height: 8,
										overflow: "hidden",
									}}>
									<div
										style={{
											width: `${Math.min(Math.max(pct, 0), 100)}%`,
											background: barC,
											height: 8,
											borderRadius: 999,
										}}
									/>
								</div>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: 11,
										color: "#64748b",
										marginTop: 4,
									}}>
									<span>
										Margen:{" "}
										<strong style={{ color: barC }}>{pct.toFixed(0)}%</strong>
										<span style={{ color: "#94a3b8" }}> · </span>
										<strong style={{ color: barC }}>S/{fmt(p.tMargin)}</strong>
									</span>
									<span>
										Prom/día: <strong>S/{fmt(p.avgDay)}</strong>
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Promedio por día de semana */}
			<div style={{ ...TC.card, padding: 0 }}>
				<CardHead
					icon="📅"
					title="Promedio por día de semana"
					color="purple"
				/>
				<div style={{ padding: 14 }}>
					{dowStats.every((d) => !d.count) ? (
						<p
							style={{
								fontSize: 12,
								color: "#94a3b8",
								textAlign: "center",
								padding: "10px 0",
							}}>
							Necesitas más datos para ver patrones
						</p>
					) : (
						dowStats.map((d) => {
							if (!d.count) return null;
							const c =
								d.avg == null
									? "#94a3b8"
									: d.avg > 100
										? "#16a34a"
										: d.avg > 0
											? "#ea580c"
											: "#dc2626";
							return (
								<div
									key={d.name}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 10,
										padding: "5px 0",
										borderBottom: "1px solid #f8fafc",
									}}>
									<span
										style={{
											fontSize: 12,
											fontWeight: 600,
											color: "#475569",
											width: 30,
										}}>
										{d.name}
									</span>
									<div
										style={{
											flex: 1,
											background: "#f1f5f9",
											borderRadius: 999,
											height: 10,
											overflow: "hidden",
										}}>
										{d.avg != null && (
											<div
												style={{
													width: `${Math.min(Math.max((d.avg / 200) * 100, 2), 100)}%`,
													background: c,
													height: 10,
													borderRadius: 999,
												}}
											/>
										)}
									</div>
									<span
										style={{
											fontSize: 12,
											fontWeight: 700,
											color: c,
											width: 65,
											textAlign: "right",
										}}>
										{d.count ? "S/" + fmt(d.avg || 0) : "-"}
									</span>
									<span style={{ fontSize: 10, color: "#94a3b8", width: 25 }}>
										{d.count}d
									</span>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
