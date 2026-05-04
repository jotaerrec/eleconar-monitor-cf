import { notFound, redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { normalizeCompanySlug } from "@/lib/company";
import { getCompanyDevices } from "@/lib/device-store";
import { getCurrentUser, userCanAccessCompany } from "@/lib/auth";
import type { DeviceData } from "@/lib/devices";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ namecompany: string }> };

export async function generateMetadata({ params }: PageProps) {
	const { namecompany } = await params;
	const slug = normalizeCompanySlug(namecompany);
	const title = slug ? `${slug} - Monitor` : "Monitor";
	return { title };
}

export default async function CompanyPage({ params }: PageProps) {
	const { namecompany: raw } = await params;
	const namecompany = normalizeCompanySlug(raw);
	if (!namecompany) notFound();
	const user = await getCurrentUser();
	if (!user) redirect("/");
	if (!(await userCanAccessCompany(namecompany, user))) redirect("/");

	let initialDevices: DeviceData[] = [];
	try {
		initialDevices = await getCompanyDevices(namecompany);
	} catch (err) {
		console.error("[CompanyPage] snapshot error:", err);
	}

	return <DashboardClient namecompany={namecompany} initialDevices={initialDevices} viewerEmail={user.email} />;
}
