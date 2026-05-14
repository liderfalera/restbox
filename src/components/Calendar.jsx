import { useState, useMemo } from "react";
import { MONTHS, WDAYS } from "../defaults.js";
import { dTotals, nc, fS } from "../utils.js";
import { TC } from "./ui.jsx";

export function Calendar({ log, prods, ings, cfg, onSelect, selected }) {
	const [cur, setCur] = useState(() => {
		const d = new Date();
		return { y: d.getFullYear(), m: d.getMonth() };
	});
	const rm = useMemo(() => {
		const map = {};
		[...log].reverse().forEach((r) => {
			map[r.fecha] = r;
		});
		return map;
	}, [log]);

	const { y, m } = cur;
	const dim = new Date(y, m + 1, 0).getDate();
	const sd = new Date(y, m, 1).getDay();
	const cells = [];
	for (let i = 0; i < sd; i++) cells.push(null);
	for (let d = 1; d <= dim; d++) cells.push(d);
	const ds = (d) =>
		`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

	return (
		<div style={{ ...TC.card, padding: 0 }}>
			{/* Header */}
			<div
				style={{
					background: "linear-gradient(135deg,#1e293b,#0f172a)",
					padding: "12px 16px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}>
				<button
					onClick={() =>
						setCur((c) => {
							const d = new Date(c.y, c.m - 1, 1);
							return { y: d.getFullYear(), m: d.getMonth() };
						})
					}
					style={{
						width: 32,
						height: 32,
						borderRadius: "50%",
						background: "rgba(255,255,255,0.1)",
						border: "none",
						cursor: "pointer",
						color: "#fff",
						fontSize: 14,
						fontWeight: 700,
					}}>
					◀
				</button>
				<span style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>
					📅 {MONTHS[m]} {y}
				</span>
				<button
					onClick={() =>
						setCur((c) => {
							const d = new Date(c.y, c.m + 1, 1);
							return { y: d.getFullYear(), m: d.getMonth() };
						})
					}
					style={{
						width: 32,
						height: 32,
						borderRadius: "50%",
						background: "rgba(255,255,255,0.1)",
						border: "none",
						cursor: "pointer",
						color: "#fff",
						fontSize: 14,
						fontWeight: 700,
					}}>
					▶
				</button>
			</div>

			<div style={{ padding: 12 }}>
				{/* Días de semana */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(7,1fr)",
						gap: 3,
						marginBottom: 6,
					}}>
					{WDAYS.map((d) => (
						<div
							key={d}
							style={{
								textAlign: "center",
								fontSize: 10,
								color: "#94a3b8",
								fontWeight: 800,
							}}>
							{d}
						</div>
					))}
				</div>

				{/* Celdas */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(7,1fr)",
						gap: 3,
					}}>
					{cells.map((day, i) => {
						if (!day)
							return (
								<div
									key={i}
									style={{ minHeight: 48 }}
								/>
							);
						const date = ds(day);
						const rec = rm[date];
						const isClosed = rec?.status === "closed";
						const tots =
							rec && !isClosed ? dTotals(rec, prods, ings, cfg) : null;
						const col = tots ? nc(tots.net) : null;
						const isSel = selected === date;
						return (
							<div
								key={i}
								onClick={() => rec && onSelect(date === selected ? null : date)}
								style={{
									minHeight: 48,
									borderRadius: 10,
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									background: isClosed
										? "#f1f5f9"
										: rec
											? `linear-gradient(135deg,${col.bg},${col.bg}cc)`
											: "#f8fafc",
									border: isSel
										? "3px solid #1e293b"
										: rec
											? `2px solid ${isClosed ? "#cbd5e1" : col.br}`
											: "1px solid #f1f5f9",
									cursor: rec ? "pointer" : "default",
									padding: 2,
								}}>
								<span
									style={{
										fontSize: 11,
										fontWeight: 700,
										color: rec ? (isClosed ? "#64748b" : col.tx) : "#94a3b8",
									}}>
									{day}
								</span>
								{tots && (
									<span
										style={{
											fontSize: 9,
											fontWeight: 800,
											color: col.tx,
											lineHeight: 1.2,
											marginTop: 1,
										}}>
										{fS(tots.net)}
									</span>
								)}
								{isClosed && (
									<span style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>
										🔒
									</span>
								)}
							</div>
						);
					})}
				</div>

				{/* Leyenda */}
				<div
					style={{
						display: "flex",
						gap: 8,
						marginTop: 10,
						flexWrap: "wrap",
						justifyContent: "center",
					}}>
					{[
						["#16a34a", "🟢 +S/100"],
						["#ea580c", "🟠 Positivo"],
						["#dc2626", "🔴 Pérdida"],
						["#64748b", "🔒 Cerrado"],
					].map(([c, l]) => (
						<span
							key={l}
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 4,
								fontSize: 10,
								color: "#64748b",
								background: `${c}15`,
								borderRadius: 999,
								padding: "3px 8px",
							}}>
							<span
								style={{
									width: 8,
									height: 8,
									borderRadius: "50%",
									background: c,
									display: "inline-block",
								}}
							/>
							{l}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
