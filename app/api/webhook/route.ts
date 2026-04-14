import { NextRequest, NextResponse } from "next/server";
import { getCompanyStub, normalizeCompanySlug } from "@/lib/company";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as Record<string, unknown>;
		const { deviceId, value, status } = body;
		const namecompany = normalizeCompanySlug(body.namecompany);

		if (!namecompany) {
			return NextResponse.json(
				{ error: "Missing or invalid namecompany (expected lowercase slug)" },
				{ status: 400 },
			);
		}
		if (!deviceId || typeof deviceId !== "string") {
			return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
		}

		const stub = await getCompanyStub(namecompany);
		await stub.update({
			deviceId,
			value: typeof value === "number" ? value : 0,
			status: typeof status === "string" ? status : "unknown",
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("[Webhook] error:", err);
		return NextResponse.json({ error: "Invalid body" }, { status: 400 });
	}
}
