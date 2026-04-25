import Image from "next/image";
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
				<Image src="/eleconar.png" alt="ELECONAR" className="brand-logo" width={220} height={70} priority />
				<h1 className="landing-title">Monitor de maquinas</h1>
				<p className="landing-kicker">MONELC</p>
				<p className="landing-subtitle">
					Ingresa a <code>/tu-empresa</code> para ver los ELC que estan reportando.
				</p>
				<div className="landing-example">
					<Link href="/elc" className="landing-link">/elc</Link>
					<span className="landing-hint">- ejemplo</span>
				</div>
			</section>
		</main>
	);
}
