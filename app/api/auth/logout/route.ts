import { NextResponse } from "next/server";
import { appendLogoutCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
	const response = NextResponse.json({ ok: true });
	appendLogoutCookie(response);
	return response;
}
