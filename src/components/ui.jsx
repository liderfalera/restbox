// Componentes UI reutilizables (sin lógica de negocio)
import { useState } from "react";

// Estilo base de tarjeta
export const TC = {
	card: {
		background: "#fff",
		borderRadius: 16,
		boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
		border: "1px solid #f1f5f9",
		marginBottom: 12,
		overflow: "hidden",
	},
};

export function Field({
	label,
	value,
	onChange,
	type = "number",
	placeholder,
	note,
	icon,
}) {
	return (
		<div style={{ marginBottom: 8 }}>
			{label && (
				<label
					style={{
						fontSize: 11,
						color: "#64748b",
						fontWeight: 700,
						display: "block",
						marginBottom: 3,
					}}>
					{icon && <span style={{ marginRight: 4 }}>{icon}</span>}
					{label}
				</label>
			)}
			<input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					width: "100%",
					border: "1px solid #e2e8f0",
					borderRadius: 10,
					padding: "8px 12px",
					fontSize: 14,
					background: "#f8fafc",
					boxSizing: "border-box",
				}}
				placeholder={placeholder || (type === "number" ? "0" : "")}
			/>
			{note && (
				<p style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{note}</p>
			)}
		</div>
	);
}

export function Toast({ msg }) {
	return msg ? (
		<div
			style={{
				position: "fixed",
				top: 20,
				left: "50%",
				transform: "translateX(-50%)",
				background: "#1e293b",
				color: "#fff",
				padding: "10px 20px",
				borderRadius: 999,
				fontSize: 13,
				fontWeight: 600,
				zIndex: 9999,
				whiteSpace: "nowrap",
				boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
			}}>
			{msg}
		</div>
	) : null;
}

export function Modal({ title, onClose, children }) {
	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.6)",
				zIndex: 500,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 16,
			}}
			onClick={onClose}>
			<div
				style={{
					background: "#fff",
					borderRadius: 16,
					maxWidth: 480,
					width: "100%",
				}}
				onClick={(e) => e.stopPropagation()}>
				<div
					style={{
						background: "linear-gradient(135deg,#1e293b,#334155)",
						padding: "14px 16px",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						borderRadius: "16px 16px 0 0",
					}}>
					<span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
						{title}
					</span>
					<button
						onClick={onClose}
						style={{
							color: "#fff",
							background: "rgba(255,255,255,0.15)",
							border: "none",
							borderRadius: "50%",
							width: 28,
							height: 28,
							cursor: "pointer",
							fontSize: 14,
						}}>
						✕
					</button>
				</div>
				<div style={{ padding: 16, maxHeight: "82vh", overflowY: "auto" }}>
					{children}
				</div>
			</div>
		</div>
	);
}

export function G2({ children }) {
	return (
		<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
			{children}
		</div>
	);
}

export function Btn({
	label,
	color = "#2563eb",
	onClick,
	full,
	small,
	outline,
	disabled,
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			style={{
				background: outline
					? "transparent"
					: `linear-gradient(135deg,${color},${color}dd)`,
				color: outline ? color : "#fff",
				border: outline ? `1.5px solid ${color}` : "none",
				borderRadius: 10,
				padding: small ? "6px 12px" : "10px 16px",
				fontWeight: 700,
				fontSize: small ? 12 : 13,
				cursor: disabled ? "not-allowed" : "pointer",
				width: full ? "100%" : "auto",
				opacity: disabled ? 0.5 : 1,
				boxShadow: outline ? "none" : `0 2px 8px ${color}40`,
			}}>
			{label}
		</button>
	);
}

export function CardHead({ icon, title, color, right }) {
	const C = {
		green: ["#f0fdf4", "#166534"],
		blue: ["#eff6ff", "#1e40af"],
		red: ["#fef2f2", "#991b1b"],
		yellow: ["#fefce8", "#854d0e"],
		purple: ["#faf5ff", "#6b21a8"],
		gray: ["#f8fafc", "#334155"],
		dark: ["#1e293b", "#fff"],
	};
	const [bg, tc] = C[color || "gray"];
	return (
		<div
			style={{
				background:
					color === "dark" ? "linear-gradient(135deg,#1e293b,#334155)" : bg,
				padding: "10px 14px",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				borderBottom: "1px solid #f1f5f9",
			}}>
			<span
				style={{
					fontWeight: 800,
					fontSize: 13,
					color: tc,
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}>
				<span style={{ fontSize: 18 }}>{icon}</span>
				{title}
			</span>
			{right}
		</div>
	);
}

export function MarginBar({ cost, price }) {
	const pct = Math.min((cost / price) * 100, 100);
	const col = pct > 75 ? "#ef4444" : pct > 55 ? "#f59e0b" : "#22c55e";
	return (
		<div style={{ marginTop: 4 }}>
			<div
				style={{
					background: "#e2e8f0",
					borderRadius: 9999,
					height: 6,
					overflow: "hidden",
				}}>
				<div
					style={{
						width: `${pct}%`,
						background: col,
						height: 6,
						borderRadius: 9999,
					}}
				/>
			</div>
			<p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
				Costo: S/{(+cost).toFixed(2)} ({pct.toFixed(0)}%) → Margen:{" "}
				<span
					style={{ fontWeight: 700, color: pct > 75 ? "#dc2626" : "#16a34a" }}>
					S/{(+price - +cost).toFixed(2)}
				</span>
			</p>
		</div>
	);
}
