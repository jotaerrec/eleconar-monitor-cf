import { NextRequest, NextResponse } from "next/server";
import { getCompanyStub, normalizeCompanySlug } from "@/lib/company";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ namecompany: string }> };

export async function GET(req: NextRequest, { params }: Params) {
	const { namecompany: raw } = await params;
	const namecompany = normalizeCompanySlug(raw);
	if (!namecompany) {
		return NextResponse.json({ error: "Invalid namecompany" }, { status: 400 });
	}

	const url = new URL(req.url);
	const initial = url.searchParams.get("initial") === "1";

	try {
		const stub = await getCompanyStub(namecompany);
		const data = initial ? await stub.snapshot() : await stub.wait();

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
