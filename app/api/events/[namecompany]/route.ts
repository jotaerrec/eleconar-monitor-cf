import { NextRequest, NextResponse } from "next/server";
import { normalizeCompanySlug } from "@/lib/company";
import { getCompanyDevices, waitForCompanyDevices } from "@/lib/device-store";
import { getCurrentUser, userCanAccessCompany } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ namecompany: string }> };

export async function GET(req: NextRequest, { params }: Params) {
	const { namecompany: raw } = await params;
	const namecompany = normalizeCompanySlug(raw);
	if (!namecompany) {
		return NextResponse.json({ error: "Invalid namecompany" }, { status: 400 });
	}
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!(await userCanAccessCompany(namecompany, user))) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const url = new URL(req.url);
	const initial = url.searchParams.get("initial") === "1";
	const since = Number(url.searchParams.get("since"));
	const sinceValue = Number.isFinite(since) ? since : null;

	try {
		const data = initial ? await getCompanyDevices(namecompany) : await waitForCompanyDevices(namecompany, sinceValue);

		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (err) {
		console.error("[Events] error:", err);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
