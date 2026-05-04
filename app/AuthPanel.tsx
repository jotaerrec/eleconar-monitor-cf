"use client";

import { useMemo, useState } from "react";

type Mode = "login" | "register";

type AuthPanelProps = {
	defaultCompanies?: string[];
};

export default function AuthPanel({ defaultCompanies = [] }: AuthPanelProps) {
	const [mode, setMode] = useState<Mode>("login");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [companiesText, setCompaniesText] = useState(defaultCompanies.join(", "));
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const companiesPreview = useMemo(
		() =>
			companiesText
				.split(",")
				.map((company) => company.trim().toLowerCase())
				.filter(Boolean),
		[companiesText],
	);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
			const payload =
				mode === "login"
					? { email, password }
					: { name, email, password, companies: companiesPreview };

			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { error?: string } | null;
				throw new Error(data?.error || "No se pudo completar la operacion");
			}

			window.location.href = "/";
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudo completar la operacion");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<section className="landing-card auth-card">
			<div className="auth-tabs" role="tablist" aria-label="Acceso">
				<button type="button" className={`auth-tab ${mode === "login" ? "is-active" : ""}`} onClick={() => setMode("login")}>
					Ingresar
				</button>
				<button type="button" className={`auth-tab ${mode === "register" ? "is-active" : ""}`} onClick={() => setMode("register")}>
					Registrarse
				</button>
			</div>

			<form className="auth-form" onSubmit={handleSubmit}>
				{mode === "register" && (
					<label className="auth-field">
						<span className="auth-label">Nombre</span>
						<input value={name} onChange={(event) => setName(event.target.value)} className="auth-input" placeholder="Juan Perez" />
					</label>
				)}

				<label className="auth-field">
					<span className="auth-label">Email</span>
					<input
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="auth-input"
						placeholder="nombre@empresa.com"
						required
					/>
				</label>

				<label className="auth-field">
					<span className="auth-label">Contrasena</span>
					<input
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="auth-input"
						placeholder="********"
						required
						minLength={8}
					/>
				</label>

				{mode === "register" && (
					<label className="auth-field">
						<span className="auth-label">Empresas</span>
						<input
							value={companiesText}
							onChange={(event) => setCompaniesText(event.target.value)}
							className="auth-input"
							placeholder="elc, prui"
							required
						/>
						{companiesPreview.length > 0 && <span className="auth-help">Vinculos: {companiesPreview.join(" - ")}</span>}
					</label>
				)}

				{error && <p className="auth-error">{error}</p>}

				<button type="submit" className="auth-submit" disabled={isSubmitting}>
					{isSubmitting ? "Procesando..." : mode === "login" ? "Entrar" : "Crear usuario"}
				</button>
			</form>
		</section>
	);
}
