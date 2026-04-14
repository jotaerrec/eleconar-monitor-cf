import { notFound } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getCompanyStub, normalizeCompanySlug } from "@/lib/company";
import type { DeviceData } from "@/worker/company-store";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ namecompany: string }> };

export async function generateMetadata({ params }: PageProps) {
	const { namecompany } = await params;
	const slug = normalizeCompanySlug(namecompany);
	const title = slug ? `${slug} — Monitor` : "Monitor";
	return { title };
}

export default async function CompanyPage({ params }: PageProps) {
	const { namecompany: raw } = await params;
	const namecompany = normalizeCompanySlug(raw);
	if (!namecompany) notFound();

	let initialDevices: DeviceData[] = [];
	try {
		const stub = await getCompanyStub(namecompany);
		initialDevices = await stub.snapshot();
	} catch (err) {
		console.error("[CompanyPage] snapshot error:", err);
	}

	return <DashboardClient namecompany={namecompany} initialDevices={initialDevices} />;
}
