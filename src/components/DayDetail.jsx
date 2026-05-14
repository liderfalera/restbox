import { useState } from "react";
import { TC, Modal } from "./ui.jsx";
import { dTotals, n, fmt, nc, fDate } from "../utils.js";

export function DayDetail({
	rec,
	prods,
	ings,
	cfg,
	onEdit,
	onDelete,
	onClose,
}) {
	const tots = dTotals(rec, prods, ings, cfg);
	const [confirming, setConfirming] = useState(false);
	const col =
		rec.status === "closed"
			? { bg: "#64748b", light: "#f1f5f9", tx: "#fff", br: "#475569" }
			: nc(tots.net);
	const W = {
		nada: "✅ Nada",
		poco: "🟡 Poco (~15%)",
		bastante: "🟠 Bastante (~30%)",
		mucho: "🔴 Mucho (+40%)",
	};

	return (
		<div style={{ ...TC.card, padding: 0 }}>
			{/* Cabecera */}
			<div
				style={{
					background: `linear-gradient(135deg,${col.bg},${col.bg}cc)`,
					padding: "12px 16px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}>
				<div>
					<span style={{ fontWeight: 800, fontSize: 15, color: col.tx }}>
						📅 {fDate(rec.fecha)}
					</span>
					{rec.status === "closed" && (
						<span
							style={{
								fontSize: 12,
								color: col.tx,
								opacity: 0.8,
								marginLeft: 8,
							}}>
							🔒 Cerrado
						</span>
					)}
				</div>
				{rec.status !== "closed" && (
					<span
						style={{
							background: "rgba(255,255,255,0.25)",
							borderRadius: 10,
							padding: "4px 12px",
							fontWeight: 900,
							fontSize: 16,
							color: col.tx,
						}}>
						S/{fmt(tots.net)}
					</span>
				)}
			</div>

			{/* Detalle por producto */}
			{rec.status !== "closed" && (
				<div style={{ padding: 14 }}>
					{prods.map((p) => {
						const bp = tots.byP[p.id] || {
							rev: 0,
							cost: 0,
							merma: 0,
							margin: 0,
						};
						const e = rec.entries?.[p.id] || {};
						if (!bp.rev && !bp.cost && !bp.merma) return null;
						return (
							<div
								key={p.id}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "6px 0",
									borderBottom: "1px solid #f1f5f9",
								}}>
								<div>
									<span style={{ fontSize: 18, marginRight: 6 }}>
										{p.emoji}
									</span>
									<span style={{ fontSize: 13, fontWeight: 600 }}>
										{p.name}
									</span>
									{p.mode === "units" && (
										<span
											style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>
											{e.prepared ? `${n(e.prepared)} prep · ` : ""}
											{e.sold ? `${n(e.sold)} vend` : ""}
											{e.prepared && n(e.prepared) > n(e.sold) && (
												<span style={{ color: "#f97316" }}>
													{" "}
													· 🗑️{n(e.prepared) - n(e.sold)}
												</span>
											)}
										</span>
									)}
								</div>
								<div style={{ textAlign: "right" }}>
									<div style={{ fontSize: 12 }}>
										<span style={{ color: "#16a34a" }}>S/{fmt(bp.rev)}</span>
										<span style={{ color: "#94a3b8" }}>
											{" "}
											− S/{fmt(bp.cost)}
										</span>
										{bp.merma > 0 && (
											<span style={{ color: "#f97316" }}>
												{" "}
												− 🗑️S/{fmt(bp.merma)}
											</span>
										)}
									</div>
									<div
										style={{
											fontSize: 13,
											fontWeight: 700,
											color: bp.margin >= 0 ? "#16a34a" : "#dc2626",
										}}>
										= S/{fmt(bp.margin)}
									</div>
								</div>
							</div>
						);
					})}

					{/* Totales */}
					<div
						style={{
							marginTop: 10,
							paddingTop: 10,
							borderTop: "1px dashed #e2e8f0",
						}}>
						{(cfg.opCosts || []).map((oc) => {
							const v = rec.opCosts?.[oc.id] ?? oc.defaultAmount;
							return (
								<div
									key={oc.id}
									style={{
										display: "flex",
										justifyContent: "space-between",
										fontSize: 12,
										color: "#64748b",
										padding: "2px 0",
									}}>
									<span>{oc.name}</span>
									<span>S/{fmt(n(v))}</span>
								</div>
							);
						})}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								fontSize: 12,
								color: "#64748b",
								padding: "2px 0",
							}}>
							<span>🏠 Provisión fijos</span>
							<span>S/{fmt(tots.fpd)}</span>
						</div>
						{tots.mermaTotal > 0 && (
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: 12,
									color: "#f97316",
									padding: "2px 0",
									fontWeight: 600,
								}}>
								<span>🗑️ Merma total</span>
								<span>S/{fmt(tots.mermaTotal)}</span>
							</div>
						)}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								fontWeight: 800,
								fontSize: 15,
								marginTop: 8,
								paddingTop: 8,
								borderTop: `1px solid ${col.br}40`,
								color: col.bg,
							}}>
							<span>💰 Ganancia neta</span>
							<span>S/{fmt(tots.net)}</span>
						</div>
					</div>
				</div>
			)}

			{/* Modal confirmación eliminar */}
			{confirming && (
				<Modal title="🗑️ Eliminar registro" onClose={() => setConfirming(false)}>
					<p style={{ fontSize: 14, color: "#475569", margin: "0 0 16px" }}>
						¿Eliminar el registro del <strong>{fDate(rec.fecha)}</strong>? Esta acción no se puede deshacer.
					</p>
					<div style={{ display: "flex", gap: 8 }}>
						<button onClick={() => setConfirming(false)}
							style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#64748b" }}>
							Cancelar
						</button>
						<button onClick={onDelete}
							style={{ flex: 1, background: "linear-gradient(135deg,#dc2626,#b91c1c)", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff" }}>
							Sí, eliminar
						</button>
					</div>
				</Modal>
			)}

			{/* Botones */}
			<div style={{ display: "flex", borderTop: "1px solid #f1f5f9" }}>
				<button onClick={onEdit}
					style={{ flex: 1, padding: 10, fontSize: 12, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>
					✏️ Editar
				</button>
				<div style={{ width: 1, background: "#f1f5f9" }} />
				<button onClick={() => setConfirming(true)}
					style={{ flex: 1, padding: 10, fontSize: 12, fontWeight: 700, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>
					🗑️ Eliminar
				</button>
				<div style={{ width: 1, background: "#f1f5f9" }} />
				<button onClick={onClose}
					style={{ flex: 1, padding: 10, fontSize: 12, fontWeight: 700, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
					✕
				</button>
			</div>
		</div>
	);
}
