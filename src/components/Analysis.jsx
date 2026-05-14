import { useMemo, useState } from "react";
import { MONTHS, WDAYS_L } from "../defaults.js";
import { dTotals, n, fmt } from "../utils.js";
import { TC, CardHead } from "./ui.jsx";

const inputStyle = {
	border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 10px",
	fontSize: 13, background: "#f8fafc", width: "100%", boxSizing: "border-box",
};

const fMonth = (ym) => {
	const [y, m] = ym.split("-");
	return `${MONTHS[parseInt(m) - 1]} ${y}`;
};

export default function Analysis({ log, prods, ings, cfg }) {
	const [desde, setDesde] = useState("");
	const [hasta, setHasta] = useState("");

	const openLog = useMemo(() =>
		log.filter((r) => {
			if (r.status === "closed") return false;
			if (desde && r.fecha < desde) return false;
			if (hasta && r.fecha > hasta) return false;
			return true;
		}),
		[log, desde, hasta],
	);

	const tots = useMemo(
		() => openLog.map((r) => dTotals(r, prods, ings, cfg)),
		[openLog, prods, ings, cfg],
	);

	const totalFixed = useMemo(
		() => (cfg.fixedCosts || []).reduce((s, f) => s + n(f.amount), 0),
		[cfg],
	);

	const prodStats = useMemo(
		() =>
			prods.map((p) => {
				let tRev = 0, tCost = 0, tMerma = 0, days = 0, tUnits = 0;
				tots.forEach((t, idx) => {
					const bp = t.byP[p.id];
					if (bp && (bp.rev > 0 || bp.cost > 0)) {
						tRev += bp.rev; tCost += bp.cost; tMerma += bp.merma; days++;
					}
					if (p.mode === "units") {
						const e = openLog[idx]?.entries[p.id];
						if (e) tUnits += n(e.sold);
					}
				});
				return { ...p, tRev, tCost, tMerma, tMargin: tRev - tCost - tMerma, days, tUnits, avgDay: days > 0 ? (tRev - tCost - tMerma) / days : 0 };
			}),
		[prods, tots, openLog],
	);

	const dowStats = useMemo(
		() =>
			WDAYS_L.map((name, i) => {
				const days = tots.filter((_, idx) => new Date(openLog[idx].fecha).getDay() === i);
				return { name, avg: days.length ? days.reduce((s, t) => s + t.net, 0) / days.length : null, count: days.length };
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
			tMerma,
		};
	}, [tots]);

	// Resumen mensual con fijos deducidos
	const monthlyStats = useMemo(() => {
		const groups = {};
		openLog.forEach((r, i) => {
			const month = r.fecha.slice(0, 7);
			if (!groups[month]) groups[month] = [];
			groups[month].push(tots[i]);
		});
		return Object.entries(groups)
			.sort(([a], [b]) => b.localeCompare(a))
			.map(([month, dayTots]) => {
				const opTotal = dayTots.reduce((s, t) => s + t.net, 0);
				return { month, opTotal, result: opTotal - totalFixed, days: dayTots.length };
			});
	}, [openLog, tots, totalFixed]);

	// Tendencia: últimos 7 días vs 7 anteriores
	const trend = useMemo(() => {
		if (openLog.length < 8) return null;
		const indexed = openLog
			.map((r, i) => ({ fecha: r.fecha, net: tots[i].net }))
			.sort((a, b) => b.fecha.localeCompare(a.fecha));
		const last7 = indexed.slice(0, 7);
		const prev7 = indexed.slice(7, 14);
		if (!prev7.length) return null;
		const avgLast = last7.reduce((s, x) => s + x.net, 0) / last7.length;
		const avgPrev = prev7.reduce((s, x) => s + x.net, 0) / prev7.length;
		const pct = avgPrev !== 0 ? ((avgLast - avgPrev) / Math.abs(avgPrev)) * 100 : null;
		return { avgLast, avgPrev, pct, up: avgLast >= avgPrev };
	}, [openLog, tots]);

	// Días necesarios para cubrir fijos
	const daysToBreakEven = useMemo(() => {
		if (!overall || overall.avg <= 0 || totalFixed === 0) return null;
		return Math.ceil(totalFixed / overall.avg);
	}, [overall, totalFixed]);

	// Estrella del menú
	const star = useMemo(
		() => prodStats.filter((p) => p.days > 0).sort((a, b) => b.tMargin - a.tMargin)[0] || null,
		[prodStats],
	);

	if (!log.length)
		return (
			<div style={{ ...TC.card, padding: 40, textAlign: "center" }}>
				<div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
				<div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>Sin datos aún</div>
				<p style={{ fontSize: 12, color: "#cbd5e1" }}>Registra días en 📝 para ver el análisis</p>
			</div>
		);

	return (
		<div>
			{/* Filtro */}
			<div style={{ ...TC.card, padding: 12 }}>
				<p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", margin: "0 0 8px" }}>🗓️ Filtrar período</p>
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
						<span style={{ fontSize: 11, color: "#64748b" }}>{openLog.length} día{openLog.length !== 1 ? "s" : ""} en el período</span>
						<button onClick={() => { setDesde(""); setHasta(""); }}
							style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
							Limpiar filtro
						</button>
					</div>
				)}
			</div>

			{/* Sin resultados */}
			{!openLog.length && (
				<div style={{ ...TC.card, padding: 32, textAlign: "center" }}>
					<div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
					<p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, margin: 0 }}>Sin registros en ese período</p>
				</div>
			)}

			{overall && (<>
				{/* Tarjetas resumen operativo */}
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
					{[
						["💰", overall.total >= 0 ? "#16a34a" : "#dc2626", "Op. acumulado", "S/ " + fmt(overall.total)],
						["📊", "#2563eb", "Promedio op./día", "S/ " + fmt(overall.avg)],
						["🏆", "#16a34a", "Mejor día", "S/ " + fmt(overall.best)],
						["📉", "#dc2626", "Peor día", "S/ " + fmt(overall.worst)],
					].map(([icon, color, label, value]) => (
						<div key={label} style={{ background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 14, padding: "12px 14px" }}>
							<div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
							<div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{label}</div>
							<div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
						</div>
					))}
				</div>

				{overall.tMerma > 0 && (
					<div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<span style={{ fontSize: 13, color: "#9a3412", fontWeight: 700 }}>🗑️ Merma total acumulada</span>
						<span style={{ fontSize: 16, fontWeight: 800, color: "#ea580c" }}>S/ {fmt(overall.tMerma)}</span>
					</div>
				)}

				{/* Tendencia + comparación mes anterior */}
				{(trend || monthlyStats.length >= 2) && (
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
						{trend ? (
							<div style={{ background: trend.up ? "#f0fdf4" : "#fef2f2", border: `1px solid ${trend.up ? "#bbf7d0" : "#fecaca"}`, borderRadius: 14, padding: "12px 14px" }}>
								<div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>TENDENCIA 7 DÍAS</div>
								<div style={{ fontSize: 22, fontWeight: 800, color: trend.up ? "#16a34a" : "#dc2626" }}>
									{trend.up ? "↑" : "↓"} {trend.pct != null ? Math.abs(trend.pct).toFixed(0) + "%" : "—"}
								</div>
								<div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
									S/{fmt(trend.avgLast)}/día vs S/{fmt(trend.avgPrev)}/día
								</div>
							</div>
						) : <div />}
						{monthlyStats.length >= 2 ? (
							<div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px" }}>
								<div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>MES ANTERIOR</div>
								<div style={{ fontSize: 15, fontWeight: 800, color: monthlyStats[1].result >= 0 ? "#16a34a" : "#dc2626" }}>
									S/ {fmt(monthlyStats[1].result)}
								</div>
								<div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{fMonth(monthlyStats[1].month)} · {monthlyStats[1].days}d</div>
							</div>
						) : <div />}
					</div>
				)}

				{/* Días para cubrir fijos */}
				{daysToBreakEven && (
					<div style={{ ...TC.card, padding: "12px 16px", marginBottom: 12 }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<div>
								<div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>🎯 Días para cubrir fijos</div>
								<div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
									Con tu promedio de S/{fmt(overall.avg)}/día · fijos S/{fmt(totalFixed)}/mes
								</div>
							</div>
							<div style={{ textAlign: "right" }}>
								<div style={{ fontSize: 28, fontWeight: 900, color: "#2563eb" }}>{daysToBreakEven}</div>
								<div style={{ fontSize: 10, color: "#94a3b8" }}>días</div>
							</div>
						</div>
					</div>
				)}

				{/* Resumen mensual con fijos */}
				<div style={{ ...TC.card, padding: 0, marginBottom: 12 }}>
					<CardHead icon="🗂️" title="Resultado por mes" color="dark" />
					<div style={{ padding: 14 }}>
						{monthlyStats.map((ms, i) => {
							const c = ms.result >= 0 ? "#16a34a" : "#dc2626";
							const delta = i === 0 && monthlyStats.length >= 2 ? ms.result - monthlyStats[1].result : null;
							return (
								<div key={ms.month} style={{ marginBottom: i < monthlyStats.length - 1 ? 14 : 0, paddingBottom: i < monthlyStats.length - 1 ? 14 : 0, borderBottom: i < monthlyStats.length - 1 ? "1px solid #f1f5f9" : "none" }}>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
										<div>
											<span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fMonth(ms.month)}</span>
											<span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>{ms.days} días</span>
											{i === 0 && <span style={{ fontSize: 10, background: "#eff6ff", color: "#2563eb", borderRadius: 999, padding: "2px 7px", marginLeft: 6, fontWeight: 700 }}>Actual</span>}
										</div>
										<div style={{ textAlign: "right" }}>
											<div style={{ fontSize: 15, fontWeight: 800, color: c }}>S/ {fmt(ms.result)}</div>
											{delta != null && (
												<div style={{ fontSize: 10, color: delta >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
													{delta >= 0 ? "▲" : "▼"} S/{fmt(Math.abs(delta))} vs anterior
												</div>
											)}
										</div>
									</div>
									<div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>
										<span>Operativo: <strong style={{ color: "#1e293b" }}>S/{fmt(ms.opTotal)}</strong></span>
										<span>Fijos: <strong style={{ color: "#dc2626" }}>− S/{fmt(totalFixed)}</strong></span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Estrella del menú */}
				{star && (
					<div style={{ background: "linear-gradient(135deg,#fefce8,#fef9c3)", border: "1.5px solid #fde047", borderRadius: 14, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
						<span style={{ fontSize: 28 }}>⭐</span>
						<div style={{ flex: 1 }}>
							<div style={{ fontSize: 10, fontWeight: 700, color: "#854d0e", marginBottom: 2 }}>ESTRELLA DEL MENÚ</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
								<span style={{ fontSize: 18 }}>{star.emoji}</span>
								<span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{star.name}</span>
							</div>
						</div>
						<div style={{ textAlign: "right" }}>
							<div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>S/{fmt(star.tMargin)}</div>
							<div style={{ fontSize: 10, color: "#64748b" }}>margen acumulado</div>
						</div>
					</div>
				)}

				{/* Rendimiento por plato */}
				<div style={{ ...TC.card, padding: 0 }}>
					<CardHead icon="📦" title="Rendimiento por plato" color="green" />
					<div style={{ padding: 14 }}>
						{prodStats.map((p) => {
							if (!p.days) return null;
							const pct = p.tRev > 0 ? (p.tMargin / p.tRev) * 100 : 0;
							const barC = pct > 40 ? "#16a34a" : pct > 20 ? "#d97706" : "#dc2626";
							return (
								<div key={p.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
										<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
											<span style={{ fontSize: 20 }}>{p.emoji}</span>
											<div>
												<span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
												{star && star.id === p.id && <span style={{ fontSize: 10, marginLeft: 4 }}>⭐</span>}
												<span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>{p.days} días{p.tUnits > 0 ? ` · ${p.tUnits} und` : ""}</span>
											</div>
										</div>
										<div style={{ textAlign: "right" }}>
											<div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>S/{fmt(p.tRev)} ingresos</div>
											{p.tMerma > 0 && <div style={{ fontSize: 11, color: "#f97316" }}>🗑️ S/{fmt(p.tMerma)} merma</div>}
										</div>
									</div>
									<div style={{ background: "#f1f5f9", borderRadius: 999, height: 8, overflow: "hidden" }}>
										<div style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: barC, height: 8, borderRadius: 999 }} />
									</div>
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 }}>
										<span>
											Margen: <strong style={{ color: barC }}>{pct.toFixed(0)}%</strong>
											<span style={{ color: "#94a3b8" }}> · </span>
											<strong style={{ color: barC }}>S/{fmt(p.tMargin)}</strong>
										</span>
										<span>Prom/día: <strong>S/{fmt(p.avgDay)}</strong></span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Promedio por día de semana */}
				<div style={{ ...TC.card, padding: 0 }}>
					<CardHead icon="📅" title="Promedio por día de semana" color="purple" />
					<div style={{ padding: 14 }}>
						{dowStats.every((d) => !d.count) ? (
							<p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>
								Necesitas más datos para ver patrones
							</p>
						) : (
							dowStats.map((d) => {
								if (!d.count) return null;
								const c = d.avg == null ? "#94a3b8" : d.avg > 100 ? "#16a34a" : d.avg > 0 ? "#ea580c" : "#dc2626";
								return (
									<div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: "1px solid #f8fafc" }}>
										<span style={{ fontSize: 12, fontWeight: 600, color: "#475569", width: 30 }}>{d.name}</span>
										<div style={{ flex: 1, background: "#f1f5f9", borderRadius: 999, height: 10, overflow: "hidden" }}>
											{d.avg != null && <div style={{ width: `${Math.min(Math.max((d.avg / 200) * 100, 2), 100)}%`, background: c, height: 10, borderRadius: 999 }} />}
										</div>
										<span style={{ fontSize: 12, fontWeight: 700, color: c, width: 65, textAlign: "right" }}>
											S/{fmt(d.avg || 0)}
										</span>
										<span style={{ fontSize: 10, color: "#94a3b8", width: 25 }}>{d.count}d</span>
									</div>
								);
							})
						)}
					</div>
				</div>
			</>)}
		</div>
	);
}
