"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { DeviceData } from "@/worker/company-store";

const FRESH_WINDOW_MS = 15_000;

type Props = {
	namecompany: string;
	initialDevices: DeviceData[];
};

export default function DashboardClient({ namecompany, initialDevices }: Props) {
	const [devices, setDevices] = useState<DeviceData[]>(initialDevices);
	const [isConnected, setIsConnected] = useState(initialDevices.length > 0);
	const [now, setNow] = useState(Date.now());
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		const tick = setInterval(() => setNow(Date.now()), 1000);
		return () => {
			mountedRef.current = false;
			clearInterval(tick);
		};
	}, []);

	useEffect(() => {
		async function poll() {
			if (!mountedRef.current) return;
			try {
				const res = await fetch(`/api/events/${namecompany}?t=${Date.now()}`);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const data: DeviceData[] = await res.json();
				if (!mountedRef.current) return;
				setDevices(data);
				setIsConnected(true);
				poll();
			} catch (err) {
				console.error("[poll] error:", err);
				if (!mountedRef.current) return;
				setIsConnected(false);
				setTimeout(poll, 3000);
			}
		}
		poll();
	}, [namecompany]);

	const isOnline = (lastUpdate: number) => now - lastUpdate < FRESH_WINDOW_MS;
	const companyLabel = formatCompanyLabel(namecompany);

	return (
		<main className="dashboard-container">
			<div className="bg-decor" aria-hidden="true">
				<div className="bg-grid" />
				<div className="bg-blob bg-blob-1" />
				<div className="bg-blob bg-blob-2" />
				<div className="bg-blob bg-blob-3" />
			</div>

			<nav className="navbar-container">
				<div className="navbar-brand">
					<Image src="/eleconar.png" alt="ELECONAR" className="brand-logo" width={220} height={56} priority />
					<div className="brand-divider" />
					<div className="brand-text">
						<span className="brand-eyebrow">{companyLabel}</span>
						<h1 className="brand-title">Monitor de maquinas</h1>
						<span className="brand-subtitle">MONELC</span>
					</div>
				</div>
				<div className="navbar-meta">
					<div className={`connection-pill ${isConnected ? "is-online" : "is-offline"}`}>
						<span className="connection-dot" />
						{isConnected ? "En linea" : "Reconectando..."}
					</div>
					<span className="navbar-clock">{new Date(now).toLocaleTimeString()}</span>
				</div>
			</nav>

			<section className="device-grid">
				{devices.length === 0 ? (
					<EmptyState namecompany={namecompany} />
				) : (
					devices.map((device) => {
						const online = isOnline(device.lastUpdate);
						const isFraccionadora = device.deviceId.startsWith("Fraccionadora");
						return (
							<article key={device.deviceId} className={`device-card ${online ? "is-on" : "is-off"}`}>
								<header className="device-header">
									<span className="device-id">{device.deviceId}</span>
									<span className={`status-badge ${online ? "status-online" : "status-offline"}`}>
										{online ? "En linea" : "Desconectado"}
									</span>
								</header>

								<div className={`device-metrics ${online ? "ring-on" : ""}`}>
									<div className="metric metric-primary">
										<span className="metric-value">{device.value.toLocaleString()}</span>
										<span className="metric-label">Velocidad</span>
									</div>
									{isFraccionadora && (
										<>
											<div className="metric-divider" />
											<div className="metric metric-secondary">
												<span className="metric-value">{(device.value / 38).toFixed(2)}</span>
												<span className="metric-label">Rollos / min</span>
											</div>
										</>
									)}
								</div>

								<footer className="device-footer">
									<span className={`machine-state ${online ? "is-on" : "is-off"}`}>
										{online ? "Maquina en marcha" : "Maquina parada"}
									</span>
									<span className="last-update">
										{online && <span className="live-indicator" />}
										Ultima vez: {new Date(device.lastUpdate).toLocaleTimeString()}
									</span>
								</footer>
							</article>
						);
					})
				)}
			</section>
		</main>
	);
}

function EmptyState({ namecompany }: { namecompany: string }) {
	return (
		<div className="empty-state">
			<svg viewBox="0 0 120 120" className="empty-illustration" aria-hidden="true">
				<defs>
					<linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#3b82f6" />
						<stop offset="1" stopColor="#10b981" />
					</linearGradient>
				</defs>
				<rect x="18" y="30" width="84" height="60" rx="10" fill="none" stroke="url(#eg)" strokeWidth="2" opacity="0.6" />
				<circle cx="60" cy="60" r="6" fill="url(#eg)">
					<animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
					<animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
				</circle>
				<path d="M36 48h14M36 72h22M74 48h12M70 72h16" stroke="url(#eg)" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
			</svg>
			<h2 className="empty-title">Esperando datos</h2>
			<p className="empty-body">
				Ningun ELC de <strong>{formatCompanyLabel(namecompany)}</strong> esta reportando.
			</p>
			<code className="empty-code">
				POST /api/webhook {"{"} deviceId, value, status, nameCompany: &quot;{namecompany}&quot; {"}"}
			</code>
		</div>
	);
}

function formatCompanyLabel(namecompany: string) {
	if (namecompany === "elc") return "ELC";
	return namecompany.replace(/-/g, " ").toUpperCase();
}
