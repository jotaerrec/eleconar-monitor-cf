import Image from "next/image";
import Link from "next/link";
import AuthPanel from "./AuthPanel";
import LogoutButton from "./LogoutButton";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Landing() {
	const user = await getCurrentUser();

	return (
		<main className="landing">
			<div className="bg-decor" aria-hidden="true">
				<div className="bg-grid" />
				<div className="bg-blob bg-blob-1" />
				<div className="bg-blob bg-blob-2" />
				<div className="bg-blob bg-blob-3" />
			</div>

			<section className="landing-card landing-shell">
				<Image src="/eleconar.png" alt="ELECONAR" className="brand-logo" width={220} height={70} priority />
				<h1 className="landing-title">Monitor de maquinas</h1>
				<p className="landing-kicker">MONELC</p>

				{user ? (
					<div className="home-panel">
						<div className="home-user">
							<div>
								<p className="home-label">Usuario</p>
								<p className="home-value">{user.displayName || user.email}</p>
								<p className="home-subvalue">{user.email}</p>
							</div>
							<LogoutButton className="logout-button" />
						</div>

						<div className="company-section">
							<p className="home-label">Empresas habilitadas</p>
							<div className="company-list">
								{user.companies.map((company) => (
									<Link key={company} href={`/${company}`} className="company-link">
										/{company}
									</Link>
								))}
							</div>
						</div>
					</div>
				) : (
					<AuthPanel defaultCompanies={["elc"]} />
				)}
			</section>
		</main>
	);
}
