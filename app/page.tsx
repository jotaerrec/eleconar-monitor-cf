import Link from "next/link";

export default function Landing() {
	return (
		<main className="landing">
			<div className="bg-decor" aria-hidden="true">
				<div className="bg-grid" />
				<div className="bg-blob bg-blob-1" />
				<div className="bg-blob bg-blob-2" />
				<div className="bg-blob bg-blob-3" />
			</div>
			<section className="landing-card">
				<img src="/fonsecasa.png" alt="Fonseca SA" className="brand-logo" />
				<h1 className="landing-title">Monitor de máquinas</h1>
				<p className="landing-subtitle">
					Ingresá a <code>/tu-empresa</code> para ver los ESPs que están reportando.
				</p>
				<div className="landing-example">
					<Link href="/fonseca" className="landing-link">/fonseca</Link>
					<span className="landing-hint">— ejemplo</span>
				</div>
			</section>
		</main>
	);
}
